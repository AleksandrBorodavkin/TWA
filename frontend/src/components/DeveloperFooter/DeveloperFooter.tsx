import React from "react";
import './DeveloperFooter.css';
import {Link} from "@/components/Link/Link.tsx";

export const DeveloperFooter: React.FC = () => {
    return (
        <footer className="developer-footer">
            <Link
                to="https://t.me/AleksandrBorodavkin"
                target="_blank"
                rel="noopener noreferrer"
            >
                <p>  @AleksandrBorodavkin </p>
            </Link>
        </footer>
    );
};
