import { useLaunchParams, miniApp, useSignal } from '@telegram-apps/sdk-react';
import {AppRoot, Spinner} from '@telegram-apps/telegram-ui';
import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';

import { routes } from '@/navigation/routes.tsx';
import useStore from "@/store.ts";
import {useEffect} from "react";
import {checkMembership} from "@/api/checkMembership.ts";
import {NotMemberPage} from "@/pages/NotMemberPage/NotMemberPage.tsx";

export function App() {
  const lp = useLaunchParams();
  const isDark = useSignal(miniApp.isDark);


  const {userIsMember, updateUserIsMember} = useStore();

  useEffect(() => {
    const checkUserMembership = async () => {
      try {
        const {isMember} = await checkMembership();
        // const isMember = user.userStatus === 'member' || user.userStatus === 'administrator' || user.userStatus === 'creator';
        updateUserIsMember(isMember);

      } catch (error) {
        console.error('Error checking membership:', error);
        miniApp.close();
      }
    };

    if (userIsMember === null) {
      checkUserMembership()
    }
  }, [userIsMember,updateUserIsMember]);

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(lp.platform) ? 'ios' : 'base'}
    >

      {userIsMember === null ? (
              <div className={'parent-spinner'}>
                <Spinner size="l"/>{' '}</div>
          ) :
          userIsMember
              ? (

                  <HashRouter>
                    <Routes>
                      {routes.map((route) => <Route key={route.path} {...route} />)}
                      <Route path="*" element={<Navigate to="/"/>}/>
                    </Routes>
                  </HashRouter>

              ) : (
                  <NotMemberPage>
                  </NotMemberPage>
              )}



    </AppRoot>
  );
}
