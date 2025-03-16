import {IEvent} from "../interfaces/IEvent";
import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

export const createEventService = async (event: IEvent) => {
    const newEvent = await prisma.event.create({
        data: {
            title: event.title,
            description: event.description,
            date: new Date(event.date).toISOString(),
            limit: Number(event.limit),
            status: event.status
        }
    });
    return {event: newEvent, message: 'Event created successfully.'};
}
export const getEventsService = async (telegramId: string) => {
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

export const getEventsByUserTelegramIdService = async (telegramId: string) => {
    const currentUserEventsList = await prisma.user.findUnique({

        where: {
            telegramId: telegramId,
        },
        include: {
            UserEvent: {
                include: {
                    event: true, // Включаем связанные события через UserEvent
                },
            },
        },
    });
}
export const getEventByIdWithUsersService = async (eventId: string) => {
    const event = await prisma.event.findUnique({
        where: {
            id: parseInt(eventId),
        },
        include:{
            UserEvent: {
                include: {
                    user: true, // Включаем пользователя через UserEvent
                },
            },
        }
    })

    return {
        id: event?.id,
        title: event?.title,
        limit: event?.limit,
        status: event?.status,
        description: event?.description,
        date: event?.date, // Преобразуем дату в строку
        participantCount: event?.UserEvent.length.toString(), // Количество участников
        participants: event?.UserEvent.map(userEvent => ({
            id: userEvent.user.id,
            telegramId: userEvent.user.telegramId,
            firstName: userEvent.user.firstName,
            lastName: userEvent.user.lastName,
            userName: userEvent.user.userName,
            languageCode: userEvent.user.languageCode,
            isAdmin: userEvent.user.isAdmin,
            isBot: userEvent.user.isBot,
        })),
    }
}
