import {PrismaClient} from '.prisma/client';
import {IEvent} from "../interfaces/IEvent";


const prisma = new PrismaClient();


export const updateEventService = async (
    eventId: number,
    updatedData: Partial<IEvent>,
    currentUserTelegramId: any
) => {
    const existingEvent = await prisma.event.findUnique({
        where: {id: eventId},
    });

    if (!existingEvent) {
        throw new Error("Event not found");
    }
    const currentUser = await prisma.user.findUnique({
        where: {telegramId: currentUserTelegramId.toString()},
    });
    if (existingEvent.creatorId !== currentUser?.id) {
        throw new Error("Unauthorized: Only the creator can update the event");
    }

    const updatedEvent = await prisma.event.update({
        where: {id: eventId},
        data: {
            title: updatedData.title,
            description: updatedData.description,
            date: updatedData.date ? new Date(updatedData.date) : undefined,
            limit: updatedData.limit !== undefined ? Number(updatedData.limit) : undefined,
            status: updatedData.status,
        },
    });

    return {event: updatedEvent, message: 'Event updated successfully.'};
};
