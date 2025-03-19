
import {createEvent} from 'ics';
import {IEvent} from "@/types/eventTypes.ts";


export const generateIcsFile = (event: IEvent): void => {
    const date = new Date(event.date);

    const icsEvent = {
        start: [
            date.getFullYear(),
            date.getMonth() + 1, // Месяцы в `ics` начинаются с 1
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
        ] as [number, number, number, number, number],
        duration: { hours: 1 }, // Длительность события (можно изменить)
        title: event.title,
        description: event.description,
        location: '', // Место проведения (если есть)
        status: 'CONFIRMED' as const
    };

    createEvent(icsEvent, (error, value) => {
        if (error) {
            console.error('Error generating .ics file:', error);
            return;
        }

        // Создаем Blob и предоставляем ссылку для скачивания
        const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        // Создаем временную ссылку для скачивания
        const link = document.createElement('a');
        link.href = url;
        link.download = `event_${event.id}.ics`;
        document.body.appendChild(link);
        link.click();

        // Убираем ссылку после скачивания
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
};