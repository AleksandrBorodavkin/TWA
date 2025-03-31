import {Page} from '@/components/Page';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {initData, miniApp} from "@telegram-apps/sdk-react";
import {Button, List, Spinner} from "@telegram-apps/telegram-ui";
import './EventDetails.css';
import {getEventDetail} from "@/api/getEventDetails.ts";
import {addUserToEvent} from "@/api/eventParticipants.ts";
import {removeUserFromEvent} from "@/api/removeUserFromEvent.ts";
import {generateIcsFile} from '@/utils/generateIcsFile';
import {IEvent} from "@/types/eventTypes.ts";
import {handlerChangeStatusEvent} from "@/api/changeEventStatus.ts";
import {markParticipantAsPaid} from "@/api/markParticipantAsPaid.ts";

export const EventDetails = () => {
    const [eventDetails, setEventDetails] = useState<IEvent | null>(null);
    const currentUser = initData.user();
    const [sentStatus, setSentStatus] = useState<string>();
    const [buttonParticipantCount, setButtonParticipantCount] = useState<number | null>();
    const {eventId} = useParams<{ eventId: string }>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [limitOfParticipantsExceeded, setLimitOfParticipantsExceeded] = useState<boolean>(false);
    const [updateParticipationCount, setUpdateParticipationCount] = useState(false)
    const [checkBoxStatus, setCheckBoxStatus] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0);

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
                .catch(() => {
                    setError('Не удалось загрузить детали события. Попробуйте позже.')
                    miniApp.close()}
                )
                .finally(() => setIsLoading(false));
        }
    }, [sentStatus, buttonParticipantCount, checkBoxStatus, refreshKey]);

    useEffect(() => {
        if (eventDetails) {
            const userExists = eventDetails.participants.some(
                user => Number(user.telegramId) === Number(currentUser?.id)
            );
            const currentUserParticipation = eventDetails.participants.find(
                participant => participant.telegramId.toString() === currentUser?.id.toString()
            );

            if (userExists) {
                setSentStatus('Уйти');


                const currentUserParticipationCount = currentUserParticipation?.participationCount || 0;
                setButtonParticipantCount(currentUserParticipationCount)
            } else {
                setSentStatus('Принять участие');
            }
        }
    }, [eventDetails, buttonParticipantCount, checkBoxStatus]);

    const handleParticipation = async (action: 'add' | 'remove') => {
        if (!eventId || !currentUser) return;

        try {
            const participantData = action === 'add'
                ? await addUserToEvent(eventId, { id: currentUser.id, username: currentUser.username! })
                : await removeUserFromEvent(eventId, { id: currentUser.id, username: currentUser.username! });


            // @ts-ignore
            setButtonParticipantCount(participantData?.updatedParticipant?.count || 0);

            await refreshEventDetails();

            // Если удалили, показать 'Принять участие', иначе скрыть
            setSentStatus(action === 'remove' ? 'Принять участие' : 'Уйти');
            setLimitOfParticipantsExceeded(false);
        } catch (error) {
            console.error('Произошла ошибка:', error);


            // @ts-ignore
            if (error.message === 'Лимит участников достигнут. Невозможно добавить нового участника.') {
                setLimitOfParticipantsExceeded(true);
            }
        } finally {
            setUpdateParticipationCount(false);
        }
    };

    const updateParticipantCount = async (action: 'add' | 'remove') => {
        if (!eventId || !currentUser || updateParticipationCount) return;
        setUpdateParticipationCount(true);

        await handleParticipation(action);
    };

    const refreshEventDetails = async () => {
        if (!eventId) {
            console.warn('eventId отсутствует, данные не обновлены.');
            return; // Не обновлять, если eventId = undefined
        }
        try {
            const updatedEvent = await getEventDetail(eventId);
            setEventDetails(updatedEvent);
        } catch (error) {
            console.error('Ошибка при обновлении данных о событии:', error);
        }
    };



    const handleExportIcs = () => {
        if (eventDetails) {
            generateIcsFile(eventDetails);
        }
    };
    const handlerStatusChange = async () => {
        setIsLoading(true);
        if (!eventDetails) {
            console.warn('eventId отсутствует, данные не обновлены.');
            return; // Не обновлять, если eventId = undefined
        }
        try {
            // Убедитесь, что event.id - число

            await handlerChangeStatusEvent(Number(eventDetails.id), !eventDetails.status);
            setCheckBoxStatus(eventDetails?.status);
        } catch (error) {
            console.error("Update failed:", error);
        } finally {
            setIsLoading(false);
        }

    };
    const handlerMarkParticipantAsPaid = async (participantTelegramId: string, paid: boolean) => {
        setIsLoading(true);
        if (!eventDetails) {
            console.warn('eventId отсутствует, данные не обновлены.');
            return; // Не обновлять, если eventId = undefined
        }
        try {

            await markParticipantAsPaid(eventDetails.id, participantTelegramId, paid);
            setRefreshKey(prev => prev + 1);

        } catch (error) {
            console.error("markParticipantAsPaid failed:", error);
        } finally {
            setIsLoading(false);
        }
    }


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
                <div>
                    <div className={'header border'}>
                        {`${eventDetails?.title}`}
                    </div>
                    <div>

                        {String(currentUser?.id) === eventDetails.creator.telegramId && (
                            <div className={'border'}>
                                <input
                                    type="checkbox"
                                    checked={eventDetails.status}
                                    onChange={handlerStatusChange}
                                    disabled={isLoading}
                                />
                                {eventDetails.status ? "Мероприятие активно" : "Мероприятие завершено"}
                                {isLoading && " (Updating...)"}
                            </div>
                        )}

                    </div>
                </div>

                <div className={'info-container border'}>
                    <div className={' creator'}>
                        <span>Организатор: {eventDetails.creator.firstName} {eventDetails.creator.lastName}</span>

                        {eventDetails.creator.userName && (
                            <a
                                href={"https://t.me/" + eventDetails.creator.userName}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                💬
                            </a>
                        )}
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
                        Мест осталось: {Number(eventDetails.limit) - Number(eventDetails.totalParticipantsCount)}<br/>
                        Всего мест: {eventDetails.limit}
                    </div>
                </div>
                <div className={"description border"}> {eventDetails?.description}</div>
            </div>

            <div className="centre">
                {sentStatus === 'Принять участие' ? (
                    <Button
                        className=""
                        mode="bezeled"
                        size="s"
                        disabled={isLoading || updateParticipationCount}
                        onClick={() => updateParticipantCount('add')}
                    >
                        🤝 Принять участие
                    </Button>
                ) : (
                    <>
                        {/* Если статус "Уйти", показать ➖ вместо основной кнопки */}
                        <Button
                            className=""
                            mode="bezeled"
                            size="s"
                            disabled={isLoading || updateParticipationCount}
                            onClick={() => updateParticipantCount('remove')}
                        >
                            ➖
                        </Button>

                        {buttonParticipantCount || 1}

                        <Button
                            className=""
                            mode="bezeled"
                            size="s"
                            disabled={isLoading || limitOfParticipantsExceeded || updateParticipationCount}
                            onClick={() => updateParticipantCount('add')}
                        >
                            ➕
                        </Button>
                    </>
                )}
            </div>


            <List>
                {eventDetails?.participants.map((participant, index) => (
                    <div className="participant" key={participant.id}>
                        {participant.userName && (
                            <a
                                href={"https://t.me/" + participant.userName}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {index + 1}. {participant.firstName} {participant.lastName}
                            </a>
                        )}
                        {!participant.userName && (
                            <div>
                                {index + 1}. {participant.firstName} {participant.lastName}
                            </div>
                        )}
                        <div style={{marginLeft: 'auto'}}>Мест: {participant.participationCount}&nbsp;&nbsp;
                            {String(currentUser?.id) === String(eventDetails.creator.telegramId) && (
                                <span key={refreshKey}>
        <button
            className={participant.paid ? 'paid-button' : 'unpaid-button'}
            disabled={isLoading}
            onClick={() => handlerMarkParticipantAsPaid(participant.telegramId, !participant.paid)}
        >
            {participant.paid ? '✓' : '₽'}
        </button>
    </span>
                            )}
                        </div>

                    </div>
                ))}
            </List>
        </Page>
    );
};
