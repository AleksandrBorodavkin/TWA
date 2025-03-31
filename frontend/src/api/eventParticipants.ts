import {httpClient} from "@/api/httpClient.ts";

const apiDomain = import.meta.env.VITE_API_DOMAIN;

export const addUserToEvent = async (
    eventId: string | undefined,
    currentUser: { id: number; username: string }
) => {
    const url = `${apiDomain}/events/${eventId}/participants`;

    try {
        const data = {
            telegramId: currentUser.id,
            userName: currentUser.username,
        };

        return await httpClient(url, {
            method: 'POST',
            body: data,
        });
    } catch (error) {
        console.error('Error adding user to event:', error);
        throw error;
    }
};
