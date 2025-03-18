import {Page} from '@/components/Page';
import {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import {initData} from "@telegram-apps/sdk-react";
import {Button, List, Spinner} from "@telegram-apps/telegram-ui";
import {Link} from '@/components/Link/Link';
import './EventDetails.css'
import {getEventDetail, IEventDetails} from "@/api/getEventDetails.ts";
import {addUserToEvent} from "@/api/eventParticipants.ts";
import {removeUserFromEvent} from "@/api/removeUserFromEvent.ts";

export const EventDetails = () => {

    const [eventDetails, setEventDetails] = useState<IEventDetails | null>(null);
    const userInfo = initData.user()
    const [sentStatus, setSentStatus] = useState<string>();
    const {eventId} = useParams<{ eventId: string }>();
    const [isLoading, setIsLoading] = useState(true); // Для управления загрузкой.
    const [error, setError] = useState<string | null>(null); // Для обработки ошибок.

    useEffect(() => {
        if (eventId) {
            setIsLoading(true); // Включаем состояние загрузки.
            setError(null); // Сбрасываем предыдущую ошибку.

            getEventDetail(eventId)
                .then(event => setEventDetails(event))
                .catch(() => setError('Не удалось загрузить детали события. Попробуйте позже.'))
                .finally(() => setIsLoading(false)); // Выключаем загрузку.
        }

    }, [sentStatus]);


    useEffect(() => {
        if (eventDetails) {
            console.log(eventDetails)
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
                // Удалить пользователя
                await removeUserFromEvent(eventId, {id: userInfo.id, username: userInfo.username!});
                setSentStatus('Принять участие');
            } else {
                // Добавить пользователя
                await addUserToEvent(eventId, {id: userInfo.id, username: userInfo.username!});
                setSentStatus('Покинуть');
            }
        } catch (error) {
            console.error('Request error:', error);
            setSentStatus('Ошибка');
        }
    };
    if (isLoading) {
        // Этап загрузки.
        return (
            <div style={{textAlign: 'center', marginTop: '5rem'}}>
                <Spinner size="l"/> {/* Отображаем спиннер */}
                <p>Загрузка...</p>
            </div>
        );
    }

    if (error) {
        // Обработка ошибки.
        return (
            <div style={{textAlign: 'center', marginTop: '5rem'}}>
                <p style={{color: 'red'}}>{error}</p>
            </div>
        );
    }

    if (!eventDetails) {
        // Случай, если данных всё равно нет (на всякий случай).
        return (
            <div style={{textAlign: 'center', marginTop: '5rem'}}>
                <p>Данные не найдены.</p>
            </div>
        );
    }


    const date = new Date(eventDetails.date);
// Форматируем в читаемый вид
    return (
        <Page>
            <div className={'section'}>
                <div className={'header'}>
                    {`${eventDetails?.title}`}
                </div>
                {eventDetails?.status && <div className={'status_true'}>Активное  </div>}
                {!eventDetails?.status && <div className={'status_false'}>  Завершено</div>}
                <br/>
                <div className="info-container">
                    <div className={"time"}>

                        📅 {`${date.getDate()} ${date.toLocaleString("ru-RU", {month: "long"})} ${date.getFullYear()}`}
                        <br/>
                        ⏰ {`${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`}
                    </div>

                    <div
                        className={"limit"}> Мест: {Number(eventDetails.limit) - Number(eventDetails.participantCount)}/{eventDetails.limit}
                    </div>
                </div>

                <div className={"description"}> {eventDetails?.description}</div>

            </div>
            <Button
                className={''}
                mode="bezeled"
                size="s"
                stretched
                disabled={isLoading} // Отключаем кнопку на время загрузки
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
                        {index + 1}. {participant.firstName} ({participant.userName}) {participant.lastName}
                    </Link>

                ))}

            </List>


        </Page>
    );
};
