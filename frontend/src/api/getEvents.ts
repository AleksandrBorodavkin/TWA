import {httpClient} from "@/api";
const apiDomain = import.meta.env.VITE_API_DOMAIN;


export interface IEvent {
    id: number;
    title: string;
    description: string;
    isParticipant?: boolean;
}
export const getEvents = async () => {
    try {
        const url = `${apiDomain}/events` ;
        return await httpClient<IEvent[]>(url, { method: 'GET'});
    } catch (error) {
        console.error('Error in getEvents:', error);
        throw error;
    }
}