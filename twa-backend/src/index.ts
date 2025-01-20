import express, {Request, Response} from 'express';
import {Bot, InlineKeyboard, webhookCallback} from "grammy";
import axios from "axios";
import helmet from 'helmet';
import cors from 'cors';
import {authMiddleware, getInitData} from "./middleware/authMiddleware";
import {User, Event} from './models';
import { bot, setupBot } from './bot';

require("dotenv").config();

const app = express();

setupBot();
app.use(express.json()); // parse the JSON request body
app.use("/bot", webhookCallback(bot, "express"));
app.use(helmet())
app.use(cors())
app.use(authMiddleware);

app.use((req, res, next) => {
    console.log(`Запрос: ${req.method} ${req.url}`);
    next();
});


// @ts-ignore
app.get('/users/:telegramId/events', async (req: Request<{ telegramId: string }>, res: Response) => {
    try {
        const {telegramId} = req.params;

        // Находим пользователя по telegramId
        const user = await User.findOne({where: {telegramId}});
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        // Получаем события, в которых участвует пользователь
        const userEvents = await user.getEvents({attributes: ['id']}); // Получаем только id событий
        const userEventIds = userEvents.map(event => event.id); // Список id событий пользователя

        // Получаем все события
        const allEvents = await Event.findAll({
            attributes: ['id', 'title', 'description', 'date'], // Выбираем нужные поля
        });

        // Добавляем флаг `isParticipant` к каждому событию
        const eventsWithParticipation = allEvents.map(event => ({
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.date,
            isParticipant: userEventIds.includes(event.id), // true, если пользователь участвует
        }));

        // Возвращаем список событий с флагами
        return res.status(200).json(eventsWithParticipation);
    } catch (error) {
        console.error('Error fetching events with participation:', error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});
// @ts-ignore
app.get('/events', async (req: Request, res: Response) => {
    try {
        // Получаем ID пользователя из инициализационных данных
        let userId = getInitData(res).user?.id;
        userId = String(userId)

        if (!userId) {
            return res.status(401).json({error: 'Unauthorized: User ID not provided'});
        }

        // Находим пользователя по ID
        const user = await User.findOne({where: {telegramId: userId}});

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        // Получаем события, в которых участвует пользователь
        const userEvents = await user.getEvents({attributes: ['id']}); // Только ID событий
        const userEventIds = userEvents.map(event => event.id);

        // Получаем все события
        const allEvents = await Event.findAll({
            attributes: ['id', 'title', 'description'], // Только нужные поля
        });

        // Добавляем флаг участия пользователя
        const eventsWithParticipation = allEvents.map(event => ({
            id: event.id,
            title: event.title,
            description: event.description,
            date: event.date,
            isParticipant: userEventIds.includes(event.id),
        }));

        // Возвращаем данные
        return res.status(200).json(eventsWithParticipation);
    } catch (error) {
        console.error('Error fetching events with participation:', error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});


// @ts-ignore
app.get('/events/:eventId/participants', async (req, res) => {
    const {eventId} = req.params;
    const event = await Event.findByPk(eventId, {
        attributes: ['id', 'title', 'description', 'date'], // Явно указываем нужные атрибуты
        include: {
            model: User,
            attributes: ['id', 'telegramId', 'userName'], // Указываем, какие поля нужны из User
            through: {attributes: []} // Исключаем лишние данные из связующей таблицы
        }
    }) as any;
    // console.log(eventId)
    // const event = await Event.findByPk(eventId, {
    //     include: User,
    // });
    if (!event) {
        return res.status(404).json({error: 'Event not found'});
    }
    const response = {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        participantCount: event.Users.length,
        participants: event.Users
    };
    // @ts-ignore
    res.json(response);
});

// @ts-ignore
app.post('/events/:eventId/participants', async (req, res) => {
    const {eventId} = req.params;
    let {telegramId, userName} = req.body;
    telegramId = String(telegramId)
    const event = await Event.findByPk(eventId);
    if (!event) {
        return res.status(404).json({error: 'Event not found'});
    }

    let user = await User.findOne({where: {telegramId, userName}});
    if (!user) {
        user = await User.create({telegramId, userName});
    }
    // @ts-ignore
    await event.addUser(user);
    res.status(200).json({message: 'User added to event', user});
});

// @ts-ignore
app.delete('/events/:eventId/participants', async (req: Request<{ eventId: string }, {}, {
    telegramId: string
}>, res: Response) => {
    try {
        const {eventId} = req.params; // Получаем eventId из параметров маршрута
        const {telegramId} = req.body; // Получаем telegramId из тела запроса

        // Проверяем наличие eventId и telegramId
        if (!eventId || !telegramId) {
            return res.status(400).json({error: 'Event ID and Telegram ID are required'});
        }

        // Найти мероприятие по ID
        const event = await Event.findByPk(eventId);
        if (!event) {
            return res.status(404).json({error: 'Event not found'});
        }

        // Найти пользователя по telegramId
        const user = await User.findOne({where: {telegramId: String(telegramId)}});
        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }

        // Проверить, состоит ли пользователь в мероприятии
        const isUserInEvent = await event.hasUser(user);
        if (!isUserInEvent) {
            return res.status(400).json({error: 'User is not a participant of this event'});
        }

        // Удалить пользователя из мероприятия
        await event.removeUser(user);

        return res.status(200).json({message: 'User successfully removed from the event'});
    } catch (error) {
        console.error('Error removing user from event:', error);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});

app.post('/events', async (req, res) => {
    const {title, description, date} = req.body;
    try {
        const event = await Event.create({title, description, date});
        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Failed to create event'});
    }
});

app.post('/add_user', async (req, res) => {
    let {telegramId, userName} = req.body;
    telegramId = String(telegramId)
    try {
        let [user, created] = await User.findOrCreate({
            where: {telegramId}, // Условие поиска только по telegramId
            defaults: {userName}     // Если не найден, создаст с этими значениями
        });

        if (!created) {
            // Пользователь уже существует
            res.status(200).json({user, message: 'User already exists.'});
        } else {
            // Новый пользователь был создан
            res.status(201).json({user, message: 'User created successfully.'});
        }
    } catch (error: any) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            // Обработка случая, когда запись уже существует
            res.status(409).json({error: 'User with this telegramId already exists.'});
        } else {
            // Обработка других ошибок
            res.status(500).json({error: error.message});
        }
    }
});

app.get('/check-user-in-group', async (req, res, next) => {
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
        res.json({userStatus:status});
    } catch (error) {

        console.error('Error:', error);
        res.status(500).json({error: 'Failed to check user status in group'});
    }
});


// Запуск сервера
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Сервер запущен на порту ${PORT}`);

    // Установка webhook
    try {
        const webhookUrl = process.env.WEBHOOK_URL;
        const response = await axios.post(
            `https://api.telegram.org/bot${bot.token}/setWebhook`,
            {url: webhookUrl}
        );
        console.log("Webhook установлен:", response.data);
    } catch (err: any) {
        console.error("Ошибка установки webhook:", err.response?.data || err.message);
    }
});
