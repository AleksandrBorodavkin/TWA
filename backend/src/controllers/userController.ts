import {Request, Response, RequestHandler} from 'express';
import {addOrFindUser, addUserToEventService, deleteUserFromEventService, findUsersInDB} from '../services/userService';
import {IUser} from "../interfaces/IUser";
import {getInitData} from "../middleware/authMiddleware";
import axios from "axios";

export const getUsers = async (req: Request, res: Response) => {
    try {
        const result = await findUsersInDB();
        res.status(200).json(result);
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({error: 'User with this telegramId already exists.'});
        } else {
            res.status(500).json({error: error.message});
        }
    }
};

export const createUser = async (req: Request, res: Response) => {
     const user= getInitData(res).user
    try {
        const result = await addOrFindUser(user);
        res.status(200).json(result);
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({error: 'User with this telegramId already exists.'});
        } else {
            res.status(500).json({error: error.message});
        }
    }
};
export const addUserToEvent = async (
    req: Request,
    res: Response
) => {
    try {
        const result = await addUserToEventService(req, res);
        res.status(200).json(result);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'User is already added to the event' });

        } else {
            res.status(500).json({error: error.message});
        }
    }
};

export const deleteUserFromEventController = async (
    req: Request<{ eventId: string }>,
    res: Response
) => {
    try {
        const { eventId } = req.params;
        const telegramId = getInitData(res).user.id;
        // const telegramId = "123456789";

        if (!eventId || !telegramId) {
            return res.status(400).json({ error: 'Event ID and Telegram ID are required' });
        }

        await deleteUserFromEventService(parseInt(eventId), String(telegramId));

        return res.status(200).json({ message: 'User successfully removed from the event' });
    } catch (error) {
        console.error('Error removing user from event:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const checkMembership = async (req: Request, res: Response) => {
    try {
        // Извлечение ID пользователя
        const userId = getInitData(res).user?.id;

        if (!userId) throw new Error('User ID not found in init data');

        // Шаг 4: Проверка членства в чате
        const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getChatMember`, {
            params: {
                chat_id: process.env.CHAT_ID,
                user_id: userId,
            },
        });

        const {status} = response.data.result;
        res.json({userStatus: status});
    } catch (error) {

        console.error('Error:', error);
        res.status(500).json({error: 'Failed to check user status in group'});
    }
};