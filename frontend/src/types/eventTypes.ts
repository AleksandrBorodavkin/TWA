interface IParticipant {
    reserveParticipantsCount: number;
    mainParticipantsCount: number;
    id: number;
    telegramId: string;
    firstName: string;
    lastName: string;
    userName: string;
    languageCode: string;
    photoUrl: string;
    allowsWriteToPm: boolean;
    participationCount: number;
    paid: boolean;
}

export interface IEvent {
    id: number,
    title: string,
    creator: IParticipant,
    limit: number,
    status: boolean,
    description: string,
    date: string,
    isParticipant: boolean;
    participantCount: string,
    totalParticipantsCount:number,
    participants: IParticipant[]
}