import {Page} from '@/components/Page';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {initData} from "@telegram-apps/sdk-react";
import {Button, Input, List, Spinner} from "@telegram-apps/telegram-ui";
import './EventDetails.css';
import {getEventDetail} from "@/api/getEventDetails.ts";
import {addUserToEvent} from "@/api/eventParticipants.ts";
import {removeUserFromEvent} from "@/api/removeUserFromEvent.ts";
import {generateIcsFile} from '@/utils/generateIcsFile';
import {IEvent} from "@/types/eventTypes.ts";
import {handlerChangeStatusEvent} from "@/api/changeEventStatus.ts";
import {markParticipantAsPaid} from "@/api/markParticipantAsPaid.ts";
import {updateEventField} from "@/api/updateEventField.ts";
import {DateTime} from 'luxon';

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

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editableTitle, setEditableTitle] = useState('');

    const [isEditingLimit, setIsEditingLimit] = useState(false);
    const [editableLimit, setEditableLimit] = useState('');

    const [isEditingDate, setIsEditingDate] = useState(false);
    const [editableDate, setEditableDate] = useState();


    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editableDescription, setEditableDescription] = useState('');

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
                        // miniApp.close()
                    }
                )
                .finally(() => setIsLoading(false));
        }
    }, [sentStatus, buttonParticipantCount, checkBoxStatus, refreshKey]);

    useEffect(() => {
        if (eventDetails) {
            setEditableTitle(eventDetails.title);
            const local = DateTime.fromISO(eventDetails.date, {zone: 'Asia/Bangkok'});
            setEditableDate(local.toFormat("yyyy-MM-dd'T'HH:mm"));

            setEditableLimit(eventDetails.limit)

            setEditableDescription(eventDetails.description);

            const userExists = eventDetails.participants.some(
                user => Number(user.telegramId) === Number(currentUser?.id)
            );
            const currentUserParticipation = eventDetails.participants.find(
                participant => participant.telegramId.toString() === currentUser?.id.toString()
            );

            if (userExists) {
                setSentStatus('Уйти');


                const currentUserParticipationCount =
                    currentUserParticipation?.mainParticipantsCount
                    + currentUserParticipation?.reserveParticipantsCount || 0;
                setButtonParticipantCount(currentUserParticipationCount)
            } else {
                setSentStatus('Принять участие');
            }
        }
    }, [eventDetails, buttonParticipantCount, checkBoxStatus]);

    const saveTitleChange = async () => {
        try {
            // вызов API на обновление
            await updateEventField(eventDetails.id, {title: editableTitle});
            setIsEditingTitle(false);
            await refreshEventDetails(); // перезагрузка данных
        } catch (e) {
            console.error('Ошибка при сохранении заголовка:', e);
        }
    };
    const saveDateChange = async () => {
        try {
            const local = DateTime.fromFormat(editableDate, "yyyy-MM-dd'T'HH:mm", {zone: 'Asia/Bangkok'});
            const utc = local.toUTC();
            await updateEventField(eventDetails.id, {date: utc.toISO()});
            setIsEditingDate(false);
            await refreshEventDetails();
        } catch (e) {
            console.error('Ошибка при сохранении даты:', e);
        }
    };


    const saveLimitChange = async () => {
        try {
            // вызов API на обновление
            await updateEventField(eventDetails.id, {limit: editableLimit});
            setIsEditingLimit(false);
            await refreshEventDetails(); // перезагрузка данных
        } catch (e) {
            console.error('Ошибка при сохранении описания:', e);
        }
    };

    const saveDescriptionChange = async () => {
        try {
            // вызов API на обновление
            await updateEventField(eventDetails.id, {description: editableDescription});
            setIsEditingDescription(false);
            await refreshEventDetails(); // перезагрузка данных
        } catch (e) {
            console.error('Ошибка при сохранении описания:', e);
        }
    };

    const handleParticipation = async (action: 'add' | 'remove') => {
        if (!eventId || !currentUser) return;

        try {
            const participantData = action === 'add'
                ? await addUserToEvent(eventId, {id: currentUser.id, username: currentUser.username!})
                : await removeUserFromEvent(eventId, {id: currentUser.id, username: currentUser.username!});


//             // @ts-ignore
//             const mainCount = participantData?.newParticipant?.mainParticipantsCount || 0;
// // @ts-ignore
//             const reserveCount = participantData?.newParticipant?.reserveParticipantsCount || 0;
//
//             setButtonParticipantCount(mainCount + reserveCount);

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


    // const handleExportIcs = () => {
    //     if (eventDetails) {
    //         generateIcsFile(eventDetails);
    //     }
    // };
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
                        {isEditingTitle ? (
                            <>
                                <input className="editable-input"
                                       value={editableTitle}
                                       onChange={(e) => setEditableTitle(e.target.value)}
                                />
                                <Button
                                    mode="plain"
                                    className="save-button"
                                    onClick={saveTitleChange}>✅Сохранить</Button>
                            </>
                        ) : (
                            <>
                                {editableTitle}

                                {String(currentUser?.id) === eventDetails.creator.telegramId && (
                                    <>
                                        <Button
                                            mode="plain"
                                            className="edit-button"
                                            onClick={() => setIsEditingTitle(true)}>✏️</Button>
                                    </>
                                )}
                            </>
                        )}
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

                <div className="organizer-container border">
                    <div className="organizer-info">
                        <span className="organizer-label">Организатор:</span>
                        <span className="organizer-name">
      {eventDetails.creator.firstName} {eventDetails.creator.lastName}
    </span>

                        {eventDetails.creator.userName && (
                            <a
                                href={`https://t.me/${eventDetails.creator.userName}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="organizer-contact"
                            >
                                <span className="telegram-icon">💬</span>
                            </a>
                        )}
                    </div>
                </div>
                <div className="info-container border">

                    <div className="time ">
                        {isEditingDate ? (
                            <>
                                <input className="editable-input"
                                       type="datetime-local"
                                       value={editableDate}
                                       onChange={(e) => setEditableDate(e.target.value)}
                                />


                                <Button
                                    mode="plain"
                                    className="save-button"
                                    onClick={saveDateChange}>✅
                                </Button>
                            </>
                        ) : (
                            <>
                                📅 {date.toLocaleDateString("ru-RU", {
                                timeZone: "Asia/Bangkok",
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                            })}
                                <br/>
                                ⏰ {date.toLocaleTimeString("ru-RU", {
                                timeZone: "Asia/Bangkok",
                                hour: "2-digit",
                                minute: "2-digit"
                            })}
                                <>

                                    {String(currentUser?.id) === eventDetails.creator.telegramId && (
                                        <>
                                            <Button
                                                mode="plain"
                                                className="edit-button"
                                                onClick={() => setIsEditingDate(true)}>✏️
                                            </Button>
                                        </>
                                    )}
                                </>
                            </>

                        )}
                    </div>
                    <div className="limit">
                        Мест занято: {
                        eventDetails.participants.reduce((sum, p) => sum + p.mainParticipantsCount, 0)
                    } / {isEditingLimit ? (
                        <>
                            <input className="editable-input editable-input-limit"
                                   type='number'

                                   value={editableLimit}
                                   onChange={(e) => setEditableLimit(e.target.value)}
                            />
                            <Button
                                mode="plain"
                                className="save-button"
                                onClick={saveLimitChange}>✅Сохранить</Button>
                        </>
                    ) : (
                        <>
                            {editableLimit}
                            {String(currentUser?.id) === eventDetails.creator.telegramId && (
                                <>
                                    <Button
                                        disabled={true}
                                        mode="plain"
                                        className="edit-button"
                                        onClick={() => setIsEditingLimit(true)}>✏️
                                    </Button>
                                </>
                            )}

                        </>
                    )} <br/>
                        В резерве: {
                        eventDetails.participants.reduce((sum, p) => sum + p.reserveParticipantsCount, 0)
                    }
                    </div>


                </div>
                <div className={"description border"}>
                    {isEditingDescription ? (
                        <>
                            <input className="editable-input"
                                   value={editableDescription}
                                   onChange={(e) => setEditableDescription(e.target.value)}
                            />
                            <Button
                                mode="plain"
                                className="save-button"
                                onClick={saveDescriptionChange}>✅Сохранить</Button>
                        </>
                    ) : (
                        <>
                            {editableDescription}
                            <>

                                {String(currentUser?.id) === eventDetails.creator.telegramId && (
                                    <>
                                        <Button
                                            mode="plain"
                                            className="edit-button"
                                            onClick={() => setIsEditingDescription(true)}>✏️
                                        </Button>
                                    </>
                                )}
                            </>

                        </>
                    )}
                </div>
            </div>

            <div className="centre">
                {sentStatus === 'Принять участие' ? (
                    <Button
                        className={limitOfParticipantsExceeded ? 'red-button' : ''}
                        mode="bezeled"
                        size="s"
                        disabled={isLoading || updateParticipationCount}
                        onClick={() => updateParticipantCount('add')}
                    >
                        {limitOfParticipantsExceeded ? '🚫 Мест нет (в резерв)' : '🤝 Принять участие'}
                    </Button>
                ) : (
                    <>
                        {/* Если статус "Уйти", показать ➖ вместо основной кнопки */}
                        <Button
                            mode="plain"
                            size="s"
                            disabled={isLoading || updateParticipationCount}
                            onClick={() => updateParticipantCount('remove')}
                        >
                            &nbsp;➖&nbsp;
                        </Button>
                        &nbsp;
                        {buttonParticipantCount || 1}
                        &nbsp;
                        <Button
                            className={limitOfParticipantsExceeded ? 'red-button' : ''}
                            mode="plain"
                            size="s"
                            disabled={isLoading || updateParticipationCount}
                            onClick={() => updateParticipantCount('add')}
                        >
                            {limitOfParticipantsExceeded ? '➕(🕒только резерв)' : '➕'}
                        </Button>
                    </>
                )}
            </div>


            <List>
                {eventDetails?.participants.map((participant, index) => (
                    <span key={participant.telegramId} className="parent-container">
<div
    className={
        `participant border ${
            String(participant.telegramId) === String(currentUser?.id) ? 'highlight-participant' : ''
        }`
    }
>
    {/* Левый блок - информация о пользователе */}
    <div className="participant-info">
      {participant.userName ? (
          <a
              href={"https://t.me/" + participant.userName}
              target="_blank"
              rel="noopener noreferrer"
              className="participant-link"
          >
              {index + 1}. {participant.firstName} {participant.lastName}
              <span className="username">
            <br/>[{participant.userName}]
          </span>
          </a>
      ) : (
          <div className="participant-name">
              {index + 1}. {participant.firstName} {participant.lastName}
          </div>
      )}
    </div>

    {/* Правый блок - статистика и кнопка */}
    <div className="participant-meta">
      <div className="participant-counts">
        {participant.mainParticipantsCount > 0 && (
            <span className="main-count">
                Мест: {participant.mainParticipantsCount}<br/>
    </span>

        )}
          {participant.reserveParticipantsCount > 0 && (
              <span className="reserve-count">
                Резерв: {participant.reserveParticipantsCount}
            </span>
          )}
      </div>

        {String(currentUser?.id) === String(eventDetails.creator.telegramId) && (
            <button
                className={participant.paid ? 'paid-button' : 'unpaid-button'}
                disabled={isLoading}
                onClick={() => handlerMarkParticipantAsPaid(participant.telegramId, !participant.paid)}
            >
                {participant.paid ? '✓' : '₽'}
            </button>
        )}
    </div>
  </div>
</span>))}
            </List>
        </Page>
    );
};
