import React from "react";
import './DeveloperFooter.css';
import {Link} from "@/components/Link/Link.tsx";
import {useLocation} from "react-router-dom";

export const DeveloperFooter: React.FC = () => {
    const location = useLocation();
    const isHelpPage = location.pathname === "/help";
    return (
        <footer className="footer-container">
            {/*<div className={"div-dev"}>*/}
            {/*    <Link*/}
            {/*        to="https://t.me/AleksandrBorodavkin"*/}

            {/*    >*/}
            {/*        @AleksandrBorodavkin*/}
            {/*    </Link>*/}
            {/*</div>*/}
            {/*<div className={"div-help"}>*/}
            <div className={"div-dev"}>
                {isHelpPage ? (
                    <Link to="/">Назад</Link>
                ) : (
                    <Link to="/help">Вопросы🤔❓</Link>
                )}
            </div>
            {/*</div>*/}

        </footer>
    );
};
