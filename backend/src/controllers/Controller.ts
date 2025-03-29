import {Request, Response, RequestHandler} from 'express';
import {
    addUserToEventService,
    deleteUserFromEventService,
    createEventService,
    getEventByIdWithUsersService,
    getEventsByUserTelegramIdService,
    changeStatusEventService, markParticipantAsPaidService
} from "../services/Service";
import {IUser} from "../interfaces/IUser";
import {IEvent} from "../interfaces/IEvent";
import {getInitData} from "../middleware/authMiddleware";
import axios from "axios";


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
        res.status(200).json(result);
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

export const deleteUserFromEventController = async (req: Request<{ eventId: string }>, res: Response) => {
    try {
        const {eventId} = req.params;
        const telegramId = getInitData(res).user.id;

        if (!eventId || !telegramId) {
            return res.status(400).json({error: 'Event ID and Telegram ID are required'});
        }

        await deleteUserFromEventService(parseInt(eventId), String(telegramId));

        return res.status(200).json({message: 'User successfully removed from the event'});
    } catch (error) {
        console.error('Error removing user from event:', error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};

export const checkMembership = async (req: Request, res: Response) => {
    try {
        const userId = getInitData(res).user?.id;
        if (!userId) throw new Error('User ID not found in init data');

        // Проверка членства в чате
        const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMember`, {
            params: {
                chat_id: process.env.CHAT_ID,
                user_id: userId,
            },
        });

        const {status} = response.data.result;
        res.json({userStatus: status});
    } catch (error) {

        res.status(500).json({error: 'Failed to check user status in group'});
    }
};