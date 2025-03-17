import {Request, Response} from "express";
import {IEvent} from "../interfaces/IEvent";
import {
    createEventService,
    getEventByIdWithUsersService,
    getEventsByUserTelegramIdService,
    getEventsService
} from "../services/eventService";
import {getInitData} from "../middleware/authMiddleware";


export const createEvent = async (req: Request, res: Response) => {
    let event: IEvent = req.body;
    try {
        const result = await createEventService(event);
        res.status(200).json(result);
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({error: 'Event with this telegramId already exists.'});
        } else {
            res.status(500).json({error: error.message});
        }
    }
};
export const getEventsController = async (req: Request, res: Response) => {
    const telegramId = getInitData(res).user?.id;
    try {
        const eventList = await getEventsService(String(telegramId));
        res.status(200).json(eventList);
    } catch (error: any) {
        res.status(500).json({error: error.message});
    }

};

export const getEventsByUserTelegramIdController = async (req: Request, res: Response) => {
    const {telegramId} = req.params;
    try {
        const result = await getEventsByUserTelegramIdService(telegramId);
        res.status(200).json(result);
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({error: 'Event with this telegramId already exists.'});
        } else {
            res.status(500).json({error: error.message});
        }
    }

}
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