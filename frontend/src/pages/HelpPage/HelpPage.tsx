import {FC,} from "react";
import {Page} from "@/components/Page.tsx";
import {FAQ} from "@/components/FAQ/FAQ.tsx";
import {Link} from "react-router-dom";


export const HelpPage: FC = () => {
    const faqItems = [
        {
            id: 1,
            question: 'Как связаться с разработчиком?',
            answer: (
                <div className={"div-dev"}>
                    Если есть какие то вопросы напишите мне в телеграмм:
                    <Link
                        to="https://t.me/AleksandrBorodavkin"

                    >
                         @AleksandrBorodavkin
                    </Link>
                </div>)
            // <p> Если есть какие то вопросы напишите мне в телеграмм:  <a style={{ maxWidth: '800px'}} href="https://t.me/@AleksandrBorodavkin">@AleksandrBorodavkin</a></p>)
        },
        {
            id: 2,
            question: 'Можно ли использовать этот компонент в проекте?',
            answer: 'Да, этот компонент можно свободно использовать в ваших проектах.',
        },
        {
            id: 3,
            question: 'Как добавить анимацию при раскрытии ответа?',
            answer: 'Вы можете добавить CSS-анимацию или использовать библиотеки типа Framer Motion.',
        },
    ];

    return (
        <Page back={true}>
            <div style={{maxWidth: '800px', margin: '0 auto', padding: '20px'}}>
                <h2>Часто задаваемые вопросы</h2>
                <FAQ items={faqItems}/>
            </div>
        </Page>
    );
};

