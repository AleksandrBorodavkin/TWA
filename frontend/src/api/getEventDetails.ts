import {httpClient} from "@/api/httpClient.ts";
import {IEvent} from "@/types/eventTypes.ts";

const apiDomain = import.meta.env.VITE_API_DOMAIN;

export const getEventDetail = async (eventId: string) => {

    try {
        const url = `${apiDomain}/events/${eventId}/participants`;
        return await httpClient<IEvent>(url, {method: 'GET'});
    } catch (error) {
        console.error('Error in checkMembership:', error);
        throw error;
    }
}


