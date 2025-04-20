import {PrismaClient} from '.prisma/client';
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

export const findOrCreateUser = async (currentUser: any) => {
    const existingUser = await prisma.user.findUnique({
        where: {
            telegramId: String(currentUser.id),
        },
    });

    if (existingUser) {
        return existingUser;
    }

    return prisma.user.create({
        data: {
            telegramId: String(currentUser.id),
            allowsWriteToPm: currentUser.allows_write_to_pm,
            userName: currentUser.username,
            firstName: currentUser.first_name,
            lastName: currentUser.last_name,
            languageCode: currentUser.language_code,
        },
    });
};

