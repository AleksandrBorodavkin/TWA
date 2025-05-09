import {PrismaClient} from '.prisma/client';


const prisma = new PrismaClient();

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

    const totalParticipantsCount = event.UserEvent.reduce(
        (sum, userEvent) => sum + userEvent.mainParticipantsCount + userEvent.reserveParticipantsCount,
        0
    );

    return {
        id: event?.id,
        title: event?.title,
        creator: event?.creator,
        limit: event?.limit,
        status: event?.status,
        description: event?.description,
        date: event?.date,
        totalParticipantsCount: totalParticipantsCount,
        participants: event?.UserEvent.map(userEvent => ({
            userId: userEvent.userId,
            paid: userEvent.paid,
            createdAt: userEvent.createdAt,
            telegramId: userEvent.user.telegramId,
            allowsWriteToPm: userEvent.user.allowsWriteToPm,
            firstName: userEvent.user.firstName,
            lastName: userEvent.user.lastName,
            userName: userEvent.user.userName,
            languageCode: userEvent.user.languageCode,
            mainParticipantsCount: userEvent.mainParticipantsCount,
            reserveParticipantsCount: userEvent.reserveParticipantsCount,
        })),
    };

}