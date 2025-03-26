import {httpClient} from "@/api/httpClient.ts";

const apiDomain = import.meta.env.VITE_API_DOMAIN;

export const handlerChangeStatusEvent = async (
    eventId: number,
    newStatus: boolean

) => {
    const url = `${apiDomain}/events/${eventId}/status`;

    try {
        const data = {
            status: newStatus,
        };
        console.log(data)

        return await httpClient(url, {
            method: 'PUT',
            body: data,
        });
    } catch (error) {
        console.error('Error changing status event:', error);
        throw error;
    }
};
