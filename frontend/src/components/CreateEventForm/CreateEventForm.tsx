import React, {useState} from 'react';
import {retrieveLaunchParams} from "@telegram-apps/sdk-react";
import useStore from "@/store.ts";
import './CreateEventForm.css'
import {Button, Input, Textarea} from "@telegram-apps/telegram-ui";

const apiDomain = import.meta.env.VITE_API_DOMAIN;

interface CreateEventFormProps {
    onSuccess?: () => void;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({onSuccess}) => {
    const [title, setTitle] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [limit, setLimit] = useState<number>();
    const [status, setStatus] = useState<boolean>(true);
    const [description, setDescription] = useState<string>('');
    const [message, setMessage] = useState<string | null>(null);
    const {initDataRaw} = retrieveLaunchParams();
    const {updateCreateFormEventShow} = useStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();


        try {
            const utcDate = new Date(date).toISOString();
            const data = {title, description, date: utcDate, limit, status};
            const response = await fetch(`${apiDomain}/events`, {
                method: 'POST',
                headers: {
                    Authorization: `tma ${initDataRaw}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }

            setMessage(`Event created successfully: ${response.statusText}`);

            // Сброс всех полей формы
            setTitle('');
            setDescription('');
            setDate('');
            setLimit(0);
            setStatus(true);

            updateCreateFormEventShow(title)

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            setMessage('Failed to create event. Please try again.');
            console.error(error);
        }
    };
    return (


        <form className={'border'} onSubmit={handleSubmit}>
            <Input header="Название:"
                   placeholder="что-нибудь..."
                   type="text"
                   value={title}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                   required/>

                <Input
                    header="Лимит :"
                    type="number"
                    id="limit"
                    value={limit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newValue = parseInt(e.target.value, 10);
                        if (!isNaN(newValue)) {
                            setLimit(newValue);
                        }
                    }}
                    required
                />
                {/*<Input*/}
                {/*    header="Активно"*/}
                {/*    type="checkbox"*/}
                {/*    checked={status}*/}
                {/*    onChange={(e) => setStatus(e.target.checked)}*/}
                {/*    */}
                {/*/>*/}




            <Input
                header="Дата и время:"
                type="datetime-local"
                id="datetime-local"
                value={date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                required
            />

            <Textarea
                header="Описание"
                type="textarea"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
                required
            />


            <Button className={'button'}
                    type="submit"
                    size="m"
                    stretched
            >

                {message ? <p>{message}</p> : <p>Создать</p>}

            </Button>
        </form>
    );
};

export default CreateEventForm;
