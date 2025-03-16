
import {httpClient} from "@/api/httpClient.ts";

const apiDomain = import.meta.env.VITE_API_DOMAIN;



interface IParticipant {
    id: number;
    telegramId: string;
    firstName: string;
    lastName: string;
    userName: string;

}

export interface IEventDetails {
    id: number,
    title: string,
    limit: number,
    status: boolean,
    description: string,
    date: string,
    participantCount: string,
    participants: IParticipant[]
}

export const getEventDetail = async (eventId: string) => {

    try {
        const url = `${apiDomain}/events/${eventId}/participants`;
        return await httpClient<IEventDetails>(url, {method: 'GET'});
    } catch (error) {
        console.error('Error in checkMembership:', error);
        throw error;
    }
}


