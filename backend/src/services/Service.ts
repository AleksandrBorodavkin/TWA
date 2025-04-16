import {PrismaClient} from '.prisma/client';
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






export const markParticipantAsPaidService = async (
    eventId: number,
    paid: boolean,
    participantTelegramId: number,
    currentUserTelegramId: number
) => {
    try {
        // 1. Проверяем, что текущий пользователь является создателем события
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { creatorId: true }
        });

        if (!event) {
            throw new Error('Event not found');
        }

        const currentUser = await prisma.user.findUnique({
            where: { telegramId: currentUserTelegramId.toString() }
        });

        if (!currentUser || event.creatorId !== currentUser.id) {
            throw new Error('Only event creator can mark participants as paid');
        }

        // 2. Находим участника по telegramId
        const participant = await prisma.user.findUnique({
            where: { telegramId: participantTelegramId.toString() }
        });

        if (!participant) {
            throw new Error('Participant not found');
        }

        // 3. Обновляем флаг paid в таблице UserEvent
        return await prisma.userEvent.update({
            where: {
                userId_eventId: {
                    userId: participant.id,
                    eventId: eventId
                }
            },
            data: {
                paid: paid
            },
            include: {
                user: true,
                event: true
            }
        });
    } catch (error) {
        console.error('Error in markParticipantAsPaidService:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
};


// backend/src/services/eventService.ts
export const changeStatusEventService = async (
    eventId: number,
    status: boolean,
    telegramId: number // Получаем telegramId из сессии/токена
) => {
    // 1. Находим пользователя по telegramId
    const user = await prisma.user.findUnique({
        where: {
            telegramId: String(telegramId) // Конвертируем в строку согласно схеме
        },
        select: {id: true}
    });

    if (!user) {
        throw new Error('User not found');
    }

    // 2. Находим событие и проверяем создателя
    const event = await prisma.event.findUnique({
        where: {id: eventId},
        select: {
            creatorId: true
        }
    });

    if (!event) {
        throw new Error('Event not found');
    }

    // 3. Сравниваем ID создателя события с ID пользователя из БД
    if (event.creatorId !== user.id) {
        throw new Error('Only event owner can modify the event');
    }

    // 4. Обновляем статус
    return prisma.event.update({
        where: {id: eventId},
        data: {status},
        select: {
            id: true,
            title: true,
            status: true
        }
    });
};


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
            id: userEvent.user.id,
            paid: userEvent.paid,
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

// export const addUserToEventService = async (req: Request, res: Response) => {
//     const currentUser = getInitData(res).user;
//     const { eventId } = req.params;
//
//     const event = await prisma.event.findUnique({
//         where: { id: parseInt(eventId) },
//     });
//
//     if (!event) {
//         return res.status(404).json({ error: 'Event not found' });
//     }
//
//     // Получаем текущее количество всех участников
//     const eventDetails = await getEventByIdWithUsersService(eventId.toString());
//     const isReserve = eventDetails.totalParticipantsCount >= eventDetails.limit;
//
//     // Ищем пользователя по telegramId
//     let user = await prisma.user.findUnique({
//         where: { telegramId: String(currentUser.id) },
//     });
//
//     if (!user) {
//         user = await prisma.user.create({
//             data: {
//                 telegramId: String(currentUser.id),
//                 allowsWriteToPm: currentUser.allows_write_to_pm,
//                 userName: currentUser.username,
//                 firstName: currentUser.first_name,
//                 lastName: currentUser.last_name,
//                 languageCode: currentUser.language_code,
//             },
//         });
//     }
//
//     const existingParticipation = await prisma.userEvent.findUnique({
//         where: {
//             userId_eventId: {
//                 userId: user.id,
//                 eventId: event.id,
//             },
//         },
//     });
//
//     let newParticipation;
//
//     if (existingParticipation) {
//         // Обновляем существующую запись
//         newParticipation = await prisma.userEvent.update({
//             where: {
//                 userId_eventId: {
//                     userId: user.id,
//                     eventId: event.id,
//                 },
//             },
//             data: isReserve
//                 ? { reserveParticipantsCount: { increment: 1 } }
//                 : { mainParticipantsCount: { increment: 1 } },
//         });
//     } else {
//         // Создаём новую запись
//         newParticipation = await prisma.userEvent.create({
//             data: {
//                 userId: user.id,
//                 eventId: event.id,
//                 mainParticipantsCount: isReserve ? 0 : 1,
//                 reserveParticipantsCount: isReserve ? 1 : 0,
//             },
//         });
//     }
//     // Получаем создателя события
//     const creator = await prisma.user.findUnique({
//         where: { id: event.creatorId },
//     });
//     if (creator?.telegramId) {
//         const role = isReserve ? "в резервный список" : "в основной список";
//         const total = eventDetails.totalParticipantsCount + 1;
//         await sendTelegramNotification(
//             creator.telegramId,
//             `➕ ${user.firstName || 'Пользователь'} (${user.userName ? '@' + user.userName : 'без username'}) присоединился ${role} события «${event.title}».\n` +
//             `👥 Всего участников: ${total}/${event.limit}`
//         );
//     }
//
//
//
//     return {
//         newParticipant: newParticipation,
//         newEvent: event,
//         isReserve,
//         message: isReserve
//             ? 'Пользователь добавлен в резерв участников'
//             : 'Пользователь добавлен в список основных участников',
//     };
// };
//




// export const decreaseParticipantsService = async (telegramId: string, eventId: number) => {
//     const event = await prisma.event.findUnique({
//         where: { id: eventId },
//         include: {
//             UserEvent: {
//                 include: { user: true }, // Нужно для уведомлений
//             },
//         },
//     });
//
//     if (!event) throw new Error("Event not found");
//
//     const user = await prisma.user.findUnique({
//         where: { telegramId },
//     });
//
//     if (!user) throw new Error("User not found");
//
//     const participation = await prisma.userEvent.findUnique({
//         where: {
//             userId_eventId: {
//                 userId: user.id,
//                 eventId,
//             },
//         },
//     });
//
//     if (!participation) throw new Error("User is not participating in this event");
//
//     let updatedParticipation = null;
//
//     if (participation.mainParticipantsCount > 1) {
//         updatedParticipation = await prisma.userEvent.update({
//             where: {
//                 userId_eventId: {
//                     userId: user.id,
//                     eventId,
//                 },
//             },
//             data: {
//                 mainParticipantsCount: { decrement: 1 },
//             },
//         });
//     } else if (participation.mainParticipantsCount === 1 && participation.reserveParticipantsCount === 0) {
//         await prisma.userEvent.delete({
//             where: {
//                 userId_eventId: {
//                     userId: user.id,
//                     eventId,
//                 },
//             },
//         });
//     } else {
//         // Если резерв есть, но основных нет — просто уменьшаем резерв
//         await prisma.userEvent.update({
//             where: {
//                 userId_eventId: {
//                     userId: user.id,
//                     eventId,
//                 },
//             },
//             data: {
//                 reserveParticipantsCount: { decrement: 1 },
//             },
//         });
//     }
//
//     // Перезапрашиваем событие
//     const updatedEvent = await prisma.event.findUnique({
//         where: { id: eventId },
//         include: {
//             UserEvent: {
//                 include: { user: true },
//             },
//         },
//     });
//
//     if (!updatedEvent) throw new Error("Failed to reload event");
//
//     const totalMain = updatedEvent.UserEvent.reduce((sum, ue) => sum + ue.mainParticipantsCount, 0);
//
//     if (totalMain < updatedEvent.limit) {
//         const reserveToPromote = updatedEvent.UserEvent.find(ue => ue.reserveParticipantsCount > 0);
//
//         if (reserveToPromote) {
//             await prisma.userEvent.update({
//                 where: {
//                     userId_eventId: {
//                         userId: reserveToPromote.userId,
//                         eventId,
//                     },
//                 },
//                 data: {
//                     reserveParticipantsCount: { decrement: 1 },
//                     mainParticipantsCount: { increment: 1 },
//                 },
//             });
//
//             // Уведомляем участника
//             await sendTelegramNotification(
//                 reserveToPromote.user.telegramId,
//                 `🎉 Освободилось место на мероприятии «${updatedEvent.title}»!\n` +
//                 `✅ Вы переведены в основной список участников.\n` +
//                 `📅 Дата: ${new Date(updatedEvent.date).toLocaleString('ru-RU')}\n` +
//                 `👤 Ваш ник: ${reserveToPromote.user.firstName || 'Пользователь'}${reserveToPromote.user.userName ? ' (@' + reserveToPromote.user.userName + ')' : ''}`
//             );
//
//             // Уведомляем создателя
//             const creator = await prisma.user.findUnique({
//                 where: {
//                     id: updatedEvent.creatorId,
//                 },
//             });
//
//             if (creator?.telegramId) {
//                 await sendTelegramNotification(
//                     creator.telegramId,
//                     `ℹ️ Участник из резерва перемещён в основной список события «${updatedEvent.title}».\n` +
//                     `👤 ${reserveToPromote.user.firstName || 'Пользователь'}${reserveToPromote.user.userName ? ' (@' + reserveToPromote.user.userName + ')' : ''}`
//                 );
//             }
//         }
//     }
//
//
//     const finalEvent = await prisma.event.findUnique({
//         where: { id: eventId },
//         include: { UserEvent: true },
//     });
//     const creator = await prisma.user.findUnique({
//         where: { id: event.creatorId },
//     });
//
//     if (creator?.telegramId) {
//         const totalMain = finalEvent?.UserEvent.reduce((sum, ue) => sum + ue.mainParticipantsCount, 0) || 0;
//         const totalReserve = finalEvent?.UserEvent.reduce((sum, ue) => sum + ue.reserveParticipantsCount, 0) || 0;
//         await sendTelegramNotification(
//             creator.telegramId,
//             `➖ ${user.firstName || 'Пользователь'} (${user.userName ? '@' + user.userName : 'без username'}) покинул событие «${event.title}».\n` +
//             `👤 Основных участников: ${totalMain}/${event.limit}\n` +
//             `⏳ В резерве: ${totalReserve}`
//         );
//     }
//     return {
//         updatedParticipant: updatedParticipation,
//         updatedEvent: finalEvent,
//         message: "User participation decreased successfully",
//     };
// };
//



