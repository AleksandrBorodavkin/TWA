import {useEffect, useState} from 'react';
import {List, Section} from "@telegram-apps/telegram-ui";
import {Link} from '@/components/Link/Link';
import useStore from "@/store.ts";
import "./EventsList.css"
import {getEvents, IEvent} from "@/api/getEvents.ts";
import CreateEventPage from "@/pages/CreateEventPage/CreateEventPage.tsx";


export const EventsList = () => {
    const [events, setEvents] = useState<IEvent[]>([]);
    const {createFormEventStatus, userStatus} = useStore();


    useEffect(() => {

        getEvents()
            .then(events => setEvents(events))
            .catch(error => console.error('Error in getEvents', error));

    }, [createFormEventStatus]);
    return (
        <div>
            <Section className={'sectionEventList'}
                     header='Скисок событий'
            >
                <List>
                    {events.map(event => (
                        <Link key={event.id}
                              to={'/events/' + event.id}
                        >
                            <div className={'event-cell'}>
                                <div className={'event-status'}>{event.isParticipant && "✔"}</div>
                                <div className={'event-title'}>{event.title}</div>

                            </div>
                        </Link>
                    ))}
                </List>
                {
                    userStatus === 'member' ||
                    userStatus === 'administrator' ||
                    userStatus === 'creator' ? (
                        <CreateEventPage/>
                    ) : (
                        <div>У вас нет прав для добавления событий</div>
                    )}
            </Section>
        </div>
    );
};
