// Тут выводиться список архивных мероприятий
import {Page} from "@/components/Page.tsx";
import {FC, useEffect, useState} from "react";
import {getEvents} from "@/api/getEvents.ts";
import {Link} from "@/components/Link/Link.tsx";
import {List} from "@telegram-apps/telegram-ui";
import {IEvent} from "@/types/eventTypes.ts"

export const ArchivePage: FC = () => {
    const [events, setEvents] = useState<IEvent[]>([]);
    useEffect(() => {

        getEvents()

            .then(events => setEvents(events.filter(event => !event.status)))

            .catch(error => console.error('Error in getEvents', error));

    }, []);
    return (
        <Page back={true}>
            <div>
                <h1>Архивные мероприятия</h1>
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
        </Page>
    )
}
