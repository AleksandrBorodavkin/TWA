import { httpClient } from '@/api/httpClient.ts';

const apiDomain = import.meta.env.VITE_API_DOMAIN;

export const checkMembership = async (): Promise<{ userStatus: string }> => {
    try {
        const url = `${apiDomain}/check-user-in-group`;
        return await httpClient<{ userStatus: string }>(url, { method: 'GET' });
    } catch (error) {
        console.error('Error in checkMembership:', error);
        throw error;
    }
};
