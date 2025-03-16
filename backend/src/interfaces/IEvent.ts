export interface IEvent {
    id: number;
    title: string;
    limit: number;
    status: boolean;
    description: string;
    date: string; // date всегда строка
    participantCount: string;
    participants: [];
}
