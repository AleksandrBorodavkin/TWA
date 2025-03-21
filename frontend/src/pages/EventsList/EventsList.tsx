import {useEffect, useState} from 'react';
import {List} from "@telegram-apps/telegram-ui";
import {Link} from '@/components/Link/Link';
import useStore from "@/store.ts";
import "./EventsList.css"
import {getEvents, IEvent} from "@/api/getEvents.ts";
import CreateEventPage from "@/pages/CreateEventPage/CreateEventPage.tsx";


export const EventsList = () => {
    const [events, setEvents] = useState<IEvent[]>([]);
    const {createFormEventStatus, userStatus} = useStore();
    const [showCreateEventPage, setShowCreateEventPage] = useState(false);

    const handleButtonClick = () => {
        setShowCreateEventPage((prev) => !prev); // Переключаем состояние
    };


    useEffect(() => {

        getEvents()
            .then(events => setEvents(events))
            .catch(error => console.error('Error in getEvents', error));

    }, [createFormEventStatus]);
    return (
        <div>
            <div className={'section_event_list'}>
                <div className={'header '}>
                    Список мероприятий
                </div>


                <List>
                    {events.map(event => (
                        <Link key={event.id}
                              to={'/events/' + event.id}
                        >
                            <div className={'event-cell border'}>
                                <div className={'event-status'}>{event.isParticipant && "✔"}</div>
                                <div className={'event-title'}>{event.title}</div>

                            </div>
                        </Link>
                    ))}
                </List>


            </div>
            <div className={'section'}>
                <div>
                    {userStatus === 'member' || userStatus === 'administrator' || userStatus === 'creator' ? (
                        <>
                            <button className={'button_show_hide_create_event'} onClick={handleButtonClick}
                            >
                                {showCreateEventPage ? 'Свернуть' : 'Добавить своё'}
                            </button>
                            {showCreateEventPage && <CreateEventPage/>}
                        </>
                    ) : (
                        <div>У вас нет прав для добавления событий</div>
                    )}
                </div>
            </div>
        </div>
    );
};
