import {getInitData} from "../middleware/authMiddleware";
import {PrismaClient} from '.prisma/client';
import {Request, Response} from "express";
import {getEventByIdWithUsersService} from "./index";
import {notifyCreator} from "../utils/telegramNotify";


const prisma = new PrismaClient();

export const addUserToEventService = async (req: Request, res: Response) => {
    const currentUser = getInitData(res).user;
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
    });

    if (!event) {
        return res.status(404).json({ error: 'Event not found' });
    }

    // Получаем текущее количество всех участников
    const eventDetails = await getEventByIdWithUsersService(eventId.toString());
    const isReserve = eventDetails.totalParticipantsCount >= eventDetails.limit;

    // Ищем пользователя по telegramId
    let user = await prisma.user.findUnique({
        where: { telegramId: String(currentUser.id) },
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                telegramId: String(currentUser.id),
                allowsWriteToPm: currentUser.allows_write_to_pm,
                userName: currentUser.username,
                firstName: currentUser.first_name,
                lastName: currentUser.last_name,
                languageCode: currentUser.language_code,
            },
        });
    }

    const existingParticipation = await prisma.userEvent.findUnique({
        where: {
            userId_eventId: {
                userId: user.id,
                eventId: event.id,
            },
        },
    });

    let newParticipation;

    if (existingParticipation) {
        // Обновляем существующую запись
        newParticipation = await prisma.userEvent.update({
            where: {
                userId_eventId: {
                    userId: user.id,
                    eventId: event.id,
                },
            },
            data: isReserve
                ? { reserveParticipantsCount: { increment: 1 } }
                : { mainParticipantsCount: { increment: 1 } },
        });
    } else {
        // Создаём новую запись
        newParticipation = await prisma.userEvent.create({
            data: {
                userId: user.id,
                eventId: event.id,
                mainParticipantsCount: isReserve ? 0 : 1,
                reserveParticipantsCount: isReserve ? 1 : 0,
            },
        });
    }
    const role = isReserve ? "в резервный список" : "в основной список";
    const total = eventDetails.totalParticipantsCount + 1;
    await notifyCreator(event.id,`➕ ${user.firstName} ${user?.lastName} (${user.userName ? '@' + user.userName : 'без username'}) \nприсоединился ${role}`

)




    return {
        newParticipant: newParticipation,
        newEvent: event,
        isReserve,
        message: isReserve
            ? 'Пользователь добавлен в резерв участников'
            : 'Пользователь добавлен в список основных участников',
    };
};
