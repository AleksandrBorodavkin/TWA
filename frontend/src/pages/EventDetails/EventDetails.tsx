import { Page } from '@/components/Page';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { initData } from "@telegram-apps/sdk-react";
import { Button, List, Spinner } from "@telegram-apps/telegram-ui";
import { Link } from '@/components/Link/Link';
import './EventDetails.css';
import { getEventDetail } from "@/api/getEventDetails.ts";
import { addUserToEvent } from "@/api/eventParticipants.ts";
import { removeUserFromEvent } from "@/api/removeUserFromEvent.ts";
import { generateIcsFile } from '@/utils/generateIcsFile';
import {IEvent} from "@/types/eventTypes.ts";

export const EventDetails = () => {
    const [eventDetails, setEventDetails] = useState<IEvent | null>(null);
    const userInfo = initData.user();
    const [sentStatus, setSentStatus] = useState<string>();
    const { eventId } = useParams<{ eventId: string }>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (eventId) {
            setIsLoading(true);
            setError(null);

            getEventDetail(eventId)
                .then(event => setEventDetails(event))
                .catch(() => setError('Не удалось загрузить детали события. Попробуйте позже.'))
                .finally(() => setIsLoading(false));
        }
    }, [sentStatus]);

    useEffect(() => {
        if (eventDetails) {
            const userExists = eventDetails.participants.some(
                user => Number(user.telegramId) === Number(userInfo?.id)
            );

            if (userExists) {
                setSentStatus('Покинуть');
            } else {
                setSentStatus('Принять участие');
            }
        }
    }, [eventDetails, userInfo]);

    const toggleUserParticipation = async () => {
        if (!eventId || !userInfo) return;

        try {
            if (sentStatus === 'Покинуть') {
                await removeUserFromEvent(eventId, { id: userInfo.id, username: userInfo.username! });
                setSentStatus('Принять участие');
            } else {
                await addUserToEvent(eventId, { id: userInfo.id, username: userInfo.username! });
                setSentStatus('Покинуть');
            }
        } catch (error) {
            console.error('Request error:', error);
            setSentStatus('Ошибка');
        }
    };

    const handleExportIcs = () => {
        if (eventDetails) {
            generateIcsFile(eventDetails);
        }
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '5rem' }}>
                <Spinner size="l" />
                <p>Загрузка...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', marginTop: '5rem' }}>
                <p style={{ color: 'red' }}>{error}</p>
            </div>
        );
    }

    if (!eventDetails) {
        return (
            <div style={{ textAlign: 'center', marginTop: '5rem' }}>
                <p>Данные не найдены.</p>
            </div>
        );
    }

    const date = new Date(eventDetails.date);

    return (
        <Page>
            <div className={'section-details'}>
                <div className={'header border'}>
                    {`${eventDetails?.title}`}
                </div>
                <div className={'info-container border'}>
                    <div className={' creator'}>
                        <img
                            src={eventDetails.creator.photoUrl}
                            alt="User Avatar"
                            style={{width: '25px', height: '25px', borderRadius: '50%'}}
                        />
                        <span>Организатор: {eventDetails.creator.firstName} {eventDetails.creator.lastName}</span>
                        <Link to={'https://t.me/' + eventDetails.creator.userName} style={{textDecoration: 'none'}}>
                            💬
                        </Link>
                    </div>
                </div>
                <div className="info-container border">
                    {/* Кнопка для экспорта .ics */}
                    <div className={"time"} onClick={handleExportIcs}>
                        📅 {`${date.getDate()} ${date.toLocaleString("ru-RU", {month: "long"})} ${date.getFullYear()}`}
                        <br/>
                        ⏰ {`${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`}
                    </div>
                    <div className={"limit"}>
                        Мест: {Number(eventDetails.limit) - Number(eventDetails.participantCount)}/{eventDetails.limit}
                    </div>
                </div>
                <div className={"description border"}> {eventDetails?.description}</div>
            </div>

            <Button
                className={''}
                mode="bezeled"
                size="s"
                stretched
                disabled={isLoading}
                onClick={toggleUserParticipation}
            >
                {sentStatus}
            </Button>


            <List>
                {eventDetails?.participants.map((participant, index) => (
                    <Link className={'participant'}
                          key={index}
                          to={'https://t.me/' + participant.userName}
                    >
                        {index + 1}. {participant.firstName} {participant.lastName} ({participant.userName})
                    </Link>
                ))}
            </List>
        </Page>
    );
};