import {useEffect, useState} from 'react';
import {List} from "@telegram-apps/telegram-ui";
import {Link} from '@/components/Link/Link';
import useStore from "@/store.ts";
import "./EventsList.css"
import {getEvents} from "@/api/getEvents.ts";
import CreateEventPage from "@/pages/CreateEventPage/CreateEventPage.tsx";
import {IEvent} from "@/types/eventTypes.ts";


export const EventsList = () => {
    const [events, setEvents] = useState<IEvent[]>([]);
    const {createFormEventShow, userIsMember} = useStore();
    const [showCreateEventPage, setShowCreateEventPage] = useState(false);

    const handleButtonClick = () => {
        setShowCreateEventPage((prev) => !prev); // Переключаем состояние
    };


    useEffect(() => {

        getEvents()
            .then(events => setEvents(events.filter(event => event.status)))
            .catch(error => console.error('Error in getEvents', error));

    }, [createFormEventShow]);
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
                    {userIsMember ? (
                        <>
                            <button className={'button_show_hide_create_event'} onClick={handleButtonClick}
                            >
                                {showCreateEventPage ? 'Свернуть' : 'Добавить своё'}
                            </button>
                            {showCreateEventPage && <CreateEventPage onSuccess={handleButtonClick} />}
                        </>
                    ) : (
                        <div>У вас нет прав для добавления событий</div>
                    )}
                </div>
            </div>
        </div>
    );
};
