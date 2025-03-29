import {httpClient} from "@/api/httpClient.ts";

const apiDomain = import.meta.env.VITE_API_DOMAIN;

export const markParticipantAsPaid = async (
    eventId: string, participantTelegramId: string, paid: boolean) => {

    const url = `${apiDomain}/events/${eventId}/payment`;

    try {
        const data = {
            "paid": paid,
            "participantTelegramId": participantTelegramId
        };


        return await httpClient(url, {
            method: 'PATCH',
            body: data,
        });
    } catch (error) {
        console.error('Error mark participant as paid: ', error);
        throw error;
    }
};