import './IndexPage.css'
import {FC} from 'react';
import {Page} from '@/components/Page.tsx';
import {EventsList} from "@/pages/EventsList/EventsList.tsx";
export const IndexPage: FC = () => {
    return (
        <Page back={false}>
            <EventsList/>
        </Page>
    );
};
