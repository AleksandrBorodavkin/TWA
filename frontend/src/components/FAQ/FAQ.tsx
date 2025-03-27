import React, { useState } from 'react';

// Тип для элемента FAQ
interface FAQItem {
    id: number;
    question: string;
    answer: React.ReactNode; // Теперь answer может содержать HTML/JSX
}

// Пропсы для компонента FAQ
interface FAQProps {
    items: FAQItem[];
}

export const FAQ: React.FC<FAQProps> = ({ items }) => {
    const [activeId, setActiveId] = useState<number | null>(null);

    const toggleAnswer = (id: number) => {
        setActiveId(activeId === id ? null : id);
    };

    return (
        <div className="faq-container">
            {items.map((item) => (
                <div key={item.id} className="faq-item">
                    <div
                        className="faq-question"
                        onClick={() => toggleAnswer(item.id)}
                        style={{
                            cursor: 'pointer',
                            padding: '10px',

                            marginBottom: '5px',
                            borderRadius: '5px',
                            fontWeight: 'bold',
                        }}
                    >
                        {item.question}
                    </div>
                    {activeId === item.id && (
                        <div
                            className="faq-answer"
                            style={{
                                padding: '10px',

                                marginBottom: '15px',
                                borderLeft: '3px solid #007bff',
                            }}
                        >
                            {item.answer}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
