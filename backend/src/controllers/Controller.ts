import {Request, Response} from 'express';
import {
    getEventByIdWithUsersService,
    getEventsByUserTelegramIdService,
    decreaseParticipantsService,
    createEventService,
    markParticipantAsPaidService,
    changeStatusEventService,
    addUserToEventService,
} from "../services";
import {IEvent} from "../interfaces/IEvent";
import {getInitData} from "../middleware/authMiddleware";
import axios from "axios";
import {updateEventService} from "../services/updateEventService";


export const markParticipantAsPaidController = async (req: Request, res: Response) => {
    try {
        const eventId = Number(req.params.eventId);
        const {paid, participantTelegramId} = req.body;
        const currentUserTelegramId = getInitData(res).user.id// Получаем из аутентификации
        const result = await markParticipantAsPaidService(
            eventId,
            paid,
            participantTelegramId,
            currentUserTelegramId
        );
        res.status(200).json(result);
    } catch (error) {
        // @ts-ignore
        res.status(403).json({error: error.message}); // 403 Forbidden для ошибок прав
    }
}
export const createEvent = async (req: Request, res: Response) => {
    let event: IEvent = req.body;
    const currentUser = getInitData(res).user
    try {
        const result = await createEventService(event, currentUser);
        res.status(200).json(result);
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({error: 'Event with this telegramId already exists.'});
        } else {
            res.status(500).json({error: error.message});
        }
    }
};


// контроллер архивации
export const changeStatusEventController = async (req: Request, res: Response) => {
    try {
        const eventId = Number(req.params.eventId);
        const {status} = req.body;
        const userId = getInitData(res).user.id // Получаем из аутентификации

        const result = await changeStatusEventService(eventId, status, userId);
        res.json(result);
    } catch (error) {
        // @ts-ignore
        res.status(403).json({error: error.message}); // 403 Forbidden для ошибок прав
    }
};
export const getEventsByUserTelegramIdController = async (req: Request, res: Response) => {
    const telegramId = getInitData(res).user?.id;
    try {
        const eventList = await getEventsByUserTelegramIdService(String(telegramId));
        res.status(200).json(eventList);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }

};

export const getEventByIdWithUsersController = async (req: Request, res: Response) => {
    const {eventId} = req.params;
    try {
        const result = await getEventByIdWithUsersService(eventId);
        res.status(200).json(result);
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({error: 'Event with this telegramId already exists.'});
        } else {
            res.status(500).json({error: error.message});
        }
    }
}
export const addUserToEvent = async (req: Request, res: Response) => {
    try {
        const result = await addUserToEventService(req, res);
        return res.status(200).json(result);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({error: 'User is already added to the event'});
        } else if (error.message === 'Лимит участников достигнут. Невозможно добавить нового участника.') {
            return res.status(400).json({error: error.message});
        } else {
            return res.status(500).json({error: error.message});
        }
    }
};

export const decreaseParticipantsController = async (req: Request, res: Response) => {
    try {
        const currentUser = getInitData(res).user;
        const { eventId } = req.params;

        // Вызываем сервис для уменьшения количества участников
        const response = await decreaseParticipantsService(String(currentUser.id), parseInt(eventId));

        return res.json(response);
    } catch (error) {
        // @ts-ignore
        return res.status(400).json({ error: error.message });
    }
};

export const updateEventController= async (req: Request, res: Response) => {
    try {
        const currentUserTelegramId = getInitData(res).user.id;
        const eventId = Number(req.params.eventId);
        const updatedData = req.body;

        const result = await updateEventService(eventId, updatedData, currentUserTelegramId);
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export const checkMembership = async (req: Request, res: Response) => {
    try {
        const userId = getInitData(res).user?.id;
        if (!userId) throw new Error('User ID not found in init data');

        // Массив чатов для проверки
        const chatIds = [
            process.env.CHAT_ID_1,
            process.env.CHAT_ID_2,
            process.env.CHAT_ID_3
        ].filter(Boolean);

        if (chatIds.length === 0) {
            throw new Error('No chat IDs configured for membership check');
        }

        const membershipChecks = chatIds.map(async (chatId) => {
            try {
                const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMember`, {
                    params: {
                        chat_id: chatId,
                        user_id: userId,
                    },
                });
                return {
                    chatId,
                    status: response.data.result?.status,
                };
            } catch (error) {
                console.error(`Error checking membership for chat ${chatId}:`, error);

                // Правильная обработка ошибки с проверкой типа
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                return {
                    chatId,
                    status: 'error',
                    error: errorMessage
                };
            }
        });

        const results = await Promise.all(membershipChecks);

        // Проверяем все значимые статусы
        const isMember = results.some(result =>
            ['creator', 'administrator', 'member', 'restricted'].includes(result.status)
        );

        // Дополнительная информация о правах
        const isAdmin = results.some(result =>
            ['creator', 'administrator'].includes(result.status)
        );

        res.json({
            isMember,  // true если creator/administrator/member/restricted
            isAdmin,   // true если creator/administrator
            memberships: results,
        });


    } catch (error) {
        console.error('Failed to check user status in groups:', error);

        // Обработка ошибки в основном блоке catch
        const errorMessage = error instanceof Error ? error.message : 'Failed to check user status in groups';

        res.status(500).json({error: errorMessage});
    }
};