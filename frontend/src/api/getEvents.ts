import {httpClient} from "@/api";
import {IEvent} from "@/types/eventTypes.ts";
const apiDomain = import.meta.env.VITE_API_DOMAIN;



export const getEvents = async () => {
    try {
        const url = `${apiDomain}/events` ;
        return await httpClient<IEvent[]>(url, { method: 'GET'});
    } catch (error) {
        console.error('Error in getEvents:', error);
        throw error;
    }
}