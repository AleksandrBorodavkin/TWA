import {PrismaClient} from '.prisma/client';


const prisma = new PrismaClient();
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