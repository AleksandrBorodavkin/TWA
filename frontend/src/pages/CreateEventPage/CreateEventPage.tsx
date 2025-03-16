

import {Section} from '@telegram-apps/telegram-ui';
import CreateEventForm from '@/components/CreateEventForm/CreateEventForm.tsx';
import "./CreateEventPage.css"

const CreateEventPage = () => {
    return (

            <Section header="Добавить событие"
                     className={'sectionCreateEventPage'}
            >
                <CreateEventForm/>
            </Section>

    );
};

export default CreateEventPage;