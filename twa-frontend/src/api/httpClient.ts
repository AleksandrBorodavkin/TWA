import {retrieveLaunchParams} from "@telegram-apps/sdk-react";

const { initDataRaw } = retrieveLaunchParams();

export type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'| undefined;
    headers?: Record<string, string>;
    body?: object;
};

export const httpClient = async <T>(
    url: string,
    options: RequestOptions = {}
): Promise<T> => {
    const { method = 'GET', headers = {}, body } = options;

    // Базовые настройки запроса
    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `tma ${initDataRaw}`,
        ...headers, // Пользовательские заголовки
    };

    try {
        // Выполняем запрос
        const response = await fetch(url, {
            method,
            headers: defaultHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        // Проверяем статус ответа
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }

        // Если есть данные, парсим JSON
        return (await response.json()) as T;
    } catch (error) {
        console.error('HTTP Client Error:', error);
        throw error; // Пробрасываем ошибку дальше, чтобы вызывать обработчик в вызывающем коде
    }
};
