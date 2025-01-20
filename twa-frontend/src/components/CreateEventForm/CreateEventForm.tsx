// CreateEventForm.tsx
import React, {useState} from 'react';
import {retrieveLaunchParams} from "@telegram-apps/sdk-react";
import useStore from "@/store.ts";
import './CreateEventForm.css'
import {Button, Input, Textarea} from "@telegram-apps/telegram-ui";

const apiDomain = import.meta.env.VITE_API_DOMAIN;

const CreateEventForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState<string | null>(null);
    const {initDataRaw} = retrieveLaunchParams();
    const {updateCreateFormEventStatus} = useStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();


        try {
            const data = {title, description, date};
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

            setTitle('');
            setDescription('');
            updateCreateFormEventStatus(title)
        } catch (error) {
            setMessage('Failed to create event. Please try again.');
            console.error(error);
        }
    };

    return (


        <form className={'form'} onSubmit={handleSubmit}>
            <Input header="Название:"
                   placeholder="что-нибудь..."
                   type="text"
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   required/>
            <Input
                header="Дата:"
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
            />

            <Textarea header="Описание"
                      placeholder="что-нибудь..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required/>
            <Button className={'button'}
                    type="submit"
                // mode="bezeled"
                    size="m"
                    stretched
                // onClick={handleSubmit}
            >

                {message ? <p>{message}</p> : <p>Create Event</p>}

            </Button>
        </form>
    );
};

export default CreateEventForm;
