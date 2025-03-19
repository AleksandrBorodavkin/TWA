interface IParticipant {
    id: number;
    telegramId: string;
    firstName: string;
    lastName: string;
    userName: string;

}

export interface IEvent {
    id: number,
    title: string,
    limit: number,
    status: boolean,
    description: string,
    date: string,
    participantCount: string,
    participants: IParticipant[]
}