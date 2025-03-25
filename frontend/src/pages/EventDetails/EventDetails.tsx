import {Page} from '@/components/Page';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {initData} from "@telegram-apps/sdk-react";
import {Button, List, Spinner} from "@telegram-apps/telegram-ui";
import {Link} from '@/components/Link/Link';
import './EventDetails.css';
import {getEventDetail} from "@/api/getEventDetails.ts";
import {addUserToEvent} from "@/api/eventParticipants.ts";
import {removeUserFromEvent} from "@/api/removeUserFromEvent.ts";
import {generateIcsFile} from '@/utils/generateIcsFile';
import {IEvent} from "@/types/eventTypes.ts";

export const EventDetails = () => {
    const [eventDetails, setEventDetails] = useState<IEvent | null>(null);
    const currentUser = initData.user();
    const [sentStatus, setSentStatus] = useState<string>();
    const [buttonParticipantCount, setButtonParticipantCount] = useState<number | null>();
    const {eventId} = useParams<{ eventId: string }>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [limitOfParticipantsExceeded, setLimitOfParticipantsExceeded] = useState<boolean>(false);
    const [isAddingParticipation, setIsAddingParticipation] = useState(false);

    useEffect(() => {
        if (eventId) {
            setIsLoading(true);
            setError(null);

            getEventDetail(eventId)
                .then(event => {
                    setEventDetails(event);

                    // Проверка лимита участников
                    if (event.totalParticipantsCount >= event.limit) {
                        setLimitOfParticipantsExceeded(true);
                    } else {
                        setLimitOfParticipantsExceeded(false);
                    }
                })
                .catch(() => setError('Не удалось загрузить детали события. Попробуйте позже.'))
                .finally(() => setIsLoading(false));
        }
    }, [sentStatus, buttonParticipantCount]);

    useEffect(() => {
        if (eventDetails) {
            const userExists = eventDetails.participants.some(
                user => Number(user.telegramId) === Number(currentUser?.id)
            );
            const currentUserParticipation = eventDetails.participants.find(
                participant => participant.telegramId.toString() === currentUser?.id.toString()
            );
            console.log(currentUserParticipation)
            // console.log(eventDetails)

            if (userExists) {
                setSentStatus('Уйти');


                const currentUserParticipationCount = currentUserParticipation?.participationCount || 0;
                setButtonParticipantCount(currentUserParticipationCount)
            } else {
                setSentStatus('Принять участие');
            }
        }
    }, [eventDetails, buttonParticipantCount]);

    const toggleUserParticipation = async () => {
        if (!eventId || !currentUser) return;

        try {
            if (sentStatus === 'Уйти') {
                await removeUserFromEvent(eventId, {id: currentUser.id, username: currentUser.username!});
                setSentStatus('Принять участие');
                setButtonParticipantCount(undefined)
                setLimitOfParticipantsExceeded(false)
            } else {
                await addUserToEvent(eventId, {id: currentUser.id, username: currentUser.username!});
                setSentStatus('Уйти');
                setLimitOfParticipantsExceeded(false)


            }
        } catch (error) {
            console.error('Request error:', error);
            setSentStatus('Ошибка');
        }
    };

    const addParticipation = async () => {
        if (!eventId || !currentUser || isAddingParticipation) return;
        setIsAddingParticipation(true);

        try {
            const newParticipant = await addUserToEvent(eventId, {id: currentUser.id, username: currentUser.username!});
            // @ts-ignore
            setButtonParticipantCount(newParticipant.newParticipant.count);

            // Обновление данных о событии
            const updatedEvent = await getEventDetail(eventId);
            setEventDetails(updatedEvent);
        } catch (error) {
            // @ts-ignore
            if (error.message === 'Лимит участников достигнут. Невозможно добавить нового участника.') {
                setLimitOfParticipantsExceeded(true);
            } else {
                console.error('Произошла ошибка:', error);
            }
        } finally {
            setIsAddingParticipation(false);
        }
    };

    const handleExportIcs = () => {
        if (eventDetails) {
            generateIcsFile(eventDetails);
        }
    };

    if (isLoading) {
        return (
            <div style={{textAlign: 'center', marginTop: '5rem'}}>
                <Spinner size="l"/>
                <p>Загрузка...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{textAlign: 'center', marginTop: '5rem'}}>
                <p style={{color: 'red'}}>{error}</p>
            </div>
        );
    }

    if (!eventDetails) {
        return (
            <div style={{textAlign: 'center', marginTop: '5rem'}}>
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
                        Мест: {Number(eventDetails.limit) - Number(eventDetails.totalParticipantsCount)}/{eventDetails.limit}
                    </div>
                </div>
                <div className={"description border"}> {eventDetails?.description}</div>
            </div>

            {/* Основная кнопка */}
            <div className={"centre"}>
            <Button
                className={''}
                mode="bezeled"
                size="s"

                disabled={isLoading}
                onClick={toggleUserParticipation}
            >
                👋 {sentStatus}
            </Button>

            {/* Кнопка +1 (только для участников) */}
            {sentStatus === 'Уйти' && (
                <Button
                    className={''}
                    mode="bezeled"
                    size="s"

                    disabled={isLoading || limitOfParticipantsExceeded || isAddingParticipation}
                    onClick={addParticipation}
                >
                    ➕🎾 ещё +1 место (всего:{buttonParticipantCount || 1})
                </Button>
            )}
            </div>


            <List>
                {eventDetails?.participants.map((participant, index) => (
                    <Link className={'participant'}
                          key={index}
                          to={'https://t.me/' + participant.userName}
                    >
                        <div>{index + 1}. {participant.firstName} {participant.lastName} ({participant.userName})</div>
                        <div>Мест:{participant.participationCount}</div>
                    </Link>
                ))}
            </List>
        </Page>
    );
};