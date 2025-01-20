import { useNavigate } from 'react-router-dom';
import { backButton } from '@telegram-apps/sdk-react';
import { PropsWithChildren, useEffect } from 'react';
import {DeveloperFooter} from "@/components/DeveloperFooter/DeveloperFooter.tsx";
import './Page.css'
export function Page({ children, back = true }: PropsWithChildren<{
  /**
   * True if it is allowed to go back from this page.
   */
  back?: boolean
}>) {
  const navigate = useNavigate();

  useEffect(() => {
    if (back) {
      backButton.show();
      return backButton.onClick(() => {
        navigate(-1);
      });
    }
    backButton.hide();
  }, [back]);

  return <div className='page-container'>
    <div className='page-content'>
      {children}
    </div>
    <DeveloperFooter />
  </div>;
}