import { httpClient } from "@/api/httpClient.ts";
const apiDomain = import.meta.env.VITE_API_DOMAIN;
export const updateEventField = async (
    eventId: number,
    fields: { [key: string]: string | number },
): Promise<void> => {
    try {
        await httpClient(`${apiDomain}/event/${eventId}`, {
            method: 'PATCH',
            body: fields
        });
    } catch (error) {
        console.error('Error updating event field:', error);
        throw error;
    }
};