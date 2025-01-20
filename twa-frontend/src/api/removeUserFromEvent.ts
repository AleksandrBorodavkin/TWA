import {httpClient, RequestOptions} from "@/api/httpClient.ts";

const apiDomain = import.meta.env.VITE_API_DOMAIN;


export const removeUserFromEvent = async (eventId: string,userInfo: { id: number; username: string }) => {
    const url = `${apiDomain}/events/${eventId}/participants`;
    const options:RequestOptions = {
        method: 'DELETE',
        body: {telegramId:userInfo.id},
    };

    try {
        const response = await httpClient<{ message: string }>(url, options);  // Ожидаем объект с сообщением
        console.log(response.message);  // Выведем сообщение в консоль или обновим UI
        return response.message; // Вернем сообщение, чтобы его можно было использовать на фронтенде
    } catch (error) {
        console.error('Request error:', error);
        throw new Error('Error removing user from event');
    }
};
