import {Spinner} from '@telegram-apps/telegram-ui';
import './IndexPage.css'
import {FC} from 'react';
import {useEffect} from "react";
import {Page} from '@/components/Page.tsx';
import {NotMemberPage} from "@/pages/NotMemberPage/NotMemberPage.tsx";
import {EventsList} from "@/pages/EventsList/EventsList.tsx";
import {checkMembership} from "@/api/checkMembership.ts";
import useStore from "@/store.ts";


export const IndexPage: FC = () => {

    const {userStatus, updateUserStatus} = useStore();

    useEffect(() => {
        const checkUserMembership = async () => {
            try {
                const user = await checkMembership();
                // const isMember = user.userStatus === 'member' || user.userStatus === 'administrator' || user.userStatus === 'creator';

                updateUserStatus(user.userStatus);

            } catch (error) {
                console.error('Error checking membership:', error);
            }
        };

        if (userStatus === null) {
            checkUserMembership();
        }
    }, [userStatus]);

    return (
        <Page back={false}>

            {userStatus === null ? (
                <div className={'parent-spinner'}>
                    <Spinner size="l"/>{' '}</div>
            ) :
                // userStatus === 'member'||
                userStatus === 'administrator' ||
                userStatus === 'creator'
                    ? (

                <EventsList/>

            ) : (
                <NotMemberPage>
                </NotMemberPage>
            )}

        </Page>
    );
};
