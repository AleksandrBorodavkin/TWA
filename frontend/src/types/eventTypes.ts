interface IParticipant {
    id: number;
    telegramId: string;
    firstName: string;
    lastName: string;
    userName: string;
    languageCode: string;
    photoUrl: string;
    allowsWriteToPm: boolean;

}

export interface IEvent {
    id: number,
    title: string,
    creator: IParticipant,
    limit: number,
    status: boolean,
    description: string,
    date: string,
    participantCount: string,
    participants: IParticipant[]
}