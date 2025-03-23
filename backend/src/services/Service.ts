import {PrismaClient} from '@prisma/client';
import {IUser} from "../interfaces/IUser";
import {Request, Response} from "express";
import {getInitData} from "../middleware/authMiddleware";
import {IEvent} from "../interfaces/IEvent";


const prisma = new PrismaClient();

export const createEventService = async (event: IEvent, currentUser: any) => {

    const newUser = await findOrCreateUser(currentUser)
    const newEvent = await prisma.event.create({
        data: {
            title: event.title,
            creatorId: newUser.id,
            description: event.description,
            date: new Date(event.date).toISOString(),
            limit: Number(event.limit),
            status: event.status
        }
    });
    return {event: newEvent, message: 'Event created successfully.'};
}

export const getEventsByUserTelegramIdService = async (telegramId: string) => {
    const events = await prisma.event.findMany({
        include: {
            UserEvent: {
                include: {
                    user: true, // Включаем пользователя через UserEvent
                },
            },
        },
    });


    // Преобразуем события, добавляя флаг участия пользователя
    return events.map(event => {
        // Проверяем, есть ли пользователь с указанным telegramId в списке участников
        const isParticipant = event.UserEvent.some(userEvent => userEvent.user.telegramId === telegramId);

        // Возвращаем событие с добавленным флагом
        return {
            ...event,
            isParticipant,
        };
    });
}

export const getEventByIdWithUsersService = async (eventId: string) => {
    const event = await prisma.event.findUnique({
        where: {
            id: parseInt(eventId),
        },
        include: {
            creator: true, // Включаем создателя события
            UserEvent: {
                include: {
                    user: true, // Включаем пользователя через UserEvent
                },
            },
        }
    })
    if (!event) {
        throw new Error('Event not found');
    }

    const totalParticipantsCount  = event.UserEvent.reduce((sum, userEvent) => sum + userEvent.count, 0);
    return {
        id: event?.id,
        title: event?.title,
        creator: event?.creator,
        limit: event?.limit,
        status: event?.status,
        description: event?.description,
        date: event?.date, // Преобразуем дату в строку
        totalParticipantsCount : totalParticipantsCount , // Количество участников
        participants: event?.UserEvent.map(userEvent => ({
            id: userEvent.user.id,
            telegramId: userEvent.user.telegramId,
            allowsWriteToPm: userEvent.user.allowsWriteToPm,
            firstName: userEvent.user.firstName,
            lastName: userEvent.user.lastName,
            userName: userEvent.user.userName,
            languageCode: userEvent.user.languageCode,
            participationCount: userEvent.count,
        })),
    }
}

export const findOrCreateUser = async (currentUser: any) => {
    const existingUser = await prisma.user.findUnique({
        where: {
            telegramId: String(currentUser.id),
        },
    });

    if (existingUser) {
        return existingUser;
    }

    const newUser = await prisma.user.create({
        data: {
            telegramId: String(currentUser.id),
            allowsWriteToPm: currentUser.allows_write_to_pm,
            userName: currentUser.username,
            firstName: currentUser.first_name,
            lastName: currentUser.last_name,
            languageCode: currentUser.language_code,
        },
    });

    return newUser;
};

export const addUserToEventService = async (req: Request, res: Response) => {
    const currentUser = getInitData(res).user
    const {eventId} = req.params;

    // Проверяем, существует ли событие
    const event = await prisma.event.findUnique({
        where: {id: parseInt(eventId)},
    });

    // Получаем данные о событии
    const eventDetails = await getEventByIdWithUsersService(eventId.toString());

    // Проверяем, не превышен ли лимит
    if (eventDetails.totalParticipantsCount >= eventDetails.limit) {
        throw new Error('Лимит участников достигнут. Невозможно добавить нового участника.');
    }

    if (!event) {
        return res.status(404).json({error: 'Event not found'});
    }

    // Ищем пользователя по telegramId
    let user = await prisma.user.findUnique({
        where: {telegramId: String(currentUser.id)},
    });

    // Если пользователь не найден, создаем нового
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
        // Если пользователь уже участвует, увеличиваем счетчик
        newParticipation = await prisma.userEvent.update({
            where: {
                userId_eventId: {
                    userId: user.id,
                    eventId: event.id,
                },
            },
            data: {
                count: existingParticipation.count + 1,
            },
        });
    } else {
        // Если пользователь не участвует, создаем новую запись
        newParticipation = await prisma.userEvent.create({
            data: {
                userId: user.id,
                eventId: event.id,
                count: 1,
            },
        });
    }

    return {newParticipant: newParticipation, newEvent:event, message: 'User added to event'};

};

export const deleteUserFromEventService = async (eventId: number, telegramId: string) => {
    // Найти мероприятие по ID
    const event = await prisma.event.findUnique({
        where: {id: eventId}
    });
    if (!event) {
        throw new Error('Event not found');
    }

    // Найти пользователя по telegramId
    const user = await prisma.user.findUnique({
        where: {telegramId: String(telegramId)}
    });
    if (!user) {
        throw new Error('User not found');
    }

    // Проверить, состоит ли пользователь в мероприятии
    const userEvent = await prisma.userEvent.findUnique({
        where: {
            userId_eventId: {
                userId: user.id,
                eventId: event.id
            }
        }
    });
    if (!userEvent) {
        throw new Error('User is not a participant of this event');
    }

    // Удалить пользователя из мероприятия
    await prisma.userEvent.delete({
        where: {
            userId_eventId: {
                userId: user.id,
                eventId: event.id
            }
        }
    });

    return {success: true, message: 'User deleted from event'};
};