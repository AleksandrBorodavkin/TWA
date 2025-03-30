import {Section} from '@telegram-apps/telegram-ui';
import CreateEventForm from '@/components/CreateEventForm/CreateEventForm.tsx';
import "./CreateEventPage.css"
interface CreateEventPageProps {
    onSuccess?: () => void;
}

const CreateEventPage = ({onSuccess}: CreateEventPageProps) => {
    return (
        <Section className={'sectionCreateEventPage'}>
            <CreateEventForm onSuccess={onSuccess} />
        </Section>
    );
};

export default CreateEventPage;