import {httpClient, RequestOptions} from "@/api/httpClient.ts";

const apiDomain = import.meta.env.VITE_API_DOMAIN;


export const removeUserFromEvent = async (
    eventId: string,
    currentUser: { id: number; username: string
    }) => {
    const url = `${apiDomain}/events/${eventId}/participants`;
    const options: RequestOptions = {
        method: 'PATCH',
        body: {telegramId: currentUser.id},
    };

    try {
          // Ожидаем объект с сообщением
        return await httpClient<{ message: string }>(url, options)
    } catch (error) {
        console.error('Request error:', error);
        throw new Error('Error removing user from event');
    }
};
