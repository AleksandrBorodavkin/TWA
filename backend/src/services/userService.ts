import {PrismaClient} from '@prisma/client';
import {IUser} from "../interfaces/IUser";
import {Request, Response} from "express";

import {getInitData} from "../middleware/authMiddleware";





const prisma = new PrismaClient();

export const addOrFindUser = async (user: IUser) => {
    const newUser = await prisma.user.create({
            data: {
                telegramId: user.telegramId,
                firstName: user.firstName,
                lastName: user.lastName,
                userName: user.userName,
                languageCode: user.languageCode,
                isAdmin: user.isAdmin,
                isBot: user.isBot

            }
        }
    );

    return {user: newUser, message: 'User created successfully.'};

};
export const findUsersInDB = async () => {
    const users = await prisma.user.findMany();
    return {users, message: 'Users fetched successfully.'};
}
export const addUserToEventService = async (req: Request, res: Response) => {
    const currentUser = getInitData(res).user
    const {eventId} = req.params;

    // Проверяем, существует ли событие
    const event = await prisma.event.findUnique({
        where: {id: parseInt(eventId)},
    });

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
                userName: currentUser.username,
                firstName: currentUser.first_name,
                lastName: currentUser.last_name,
                languageCode: currentUser.language_code,
                isAdmin: true,
                isBot: true
            },
        });
    }

    // Добавляем пользователя в событие
    const newParticipant = await prisma.userEvent.create({
        data: {
            userId: user.id,
            eventId: event.id,
        },
    });

    return {newParticipant: newParticipant, message: 'User added to event'};

};


export const deleteUserFromEventService = async (eventId: number, telegramId: string) => {
    // Найти мероприятие по ID
    const event = await prisma.event.findUnique({
        where: { id: eventId }
    });
    if (!event) {
        throw new Error('Event not found');
    }

    // Найти пользователя по telegramId
    const user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) }
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

    return { success: true ,message: 'User deleted from event'};
};