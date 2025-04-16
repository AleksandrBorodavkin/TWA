import {PrismaClient} from '.prisma/client';
import {sendTelegramNotification} from './sendTelegramNotification'; // путь к твоей функции

const prisma = new PrismaClient();

/**
 * Уведомляет создателя события по его eventId
 */
export const notifyCreator = async (eventId: number, message: string) => {
    try {
        const event = await prisma.event.findUnique({
            where: {id: eventId},
            select: {
                title: true,
                creator: {
                    select: {
                        telegramId: true
                    }
                }
            }
        });
        const finalEvent = await prisma.event.findUnique({
            where: {id: eventId},
            include: {UserEvent: true},
        });
        // const creator = await prisma.user.findUnique({
        //     where: {id: event.creatorId},
        // });


        const totalMain = finalEvent?.UserEvent.reduce((sum, ue) => sum + ue.mainParticipantsCount, 0) || 0;
        const totalReserve = finalEvent?.UserEvent.reduce((sum, ue) => sum + ue.reserveParticipantsCount, 0) || 0;
        if (event?.creator?.telegramId) {
            const fullMessage =
                `${message}\n` +
                "\n" +
                `❗Уведомление только для организатора\n` +
                `🔔 Событие: «${finalEvent?.title}»\n` +
                `👥 Лимит участников: ${finalEvent?.limit}\n` +
                `👤 Основных участников: ${totalMain}\n` +
                `⏳ В резерве: ${totalReserve}\n`
            ;
            await sendTelegramNotification(event.creator.telegramId, fullMessage);
        }
    } catch (err) {
        console.error('Ошибка при отправке уведомления создателю:', err);
    }
};
