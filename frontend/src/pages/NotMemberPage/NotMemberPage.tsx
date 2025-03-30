import { FC } from 'react';
import './NotMemberPage.css';

export const NotMemberPage: FC = () => {
    return (
        <div className="membership-container">
            <div className="membership-card">
                <div className="emoji-header">🔒</div>

                <h3 className="main-heading">
                    Доступ к Eventify
                    <span className="highlight">только для участников группы Omerta</span>
                </h3>

                <div className="benefits-section">
                    <h4 className="benefits-heading">Ваши преимущества при использовании:</h4>
                    <ul className="benefits-list">
                        <li>📅 Единый календарь активностей</li>
                        <li>💬 Прямой чат с участником</li>
                        <li>🔔 Уведомления об освободившихся местах.</li>
                    </ul>
                </div>

                <div className="cta-section">
                    <a
                        href="https://t.me/AleksandrBorodavkin"
                        className="contact-button"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        📨 Написать разработчику
                    </a>
                </div>

                <div className="footer-note">

                </div>
            </div>
        </div>
    );
};