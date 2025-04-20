import {httpClient} from '@/api/httpClient.ts';

const apiDomain = import.meta.env.VITE_API_DOMAIN;
type ChatMemberStatus = 'creator' | 'administrator' | 'member' | 'restricted' | 'left' | 'kicked';

interface ChatMembership {
    chatId: string;
    status: ChatMemberStatus;
}

interface MembershipResponse {
    isMember: boolean;
    memberships: ChatMembership[];
}

export const checkMembership = async (): Promise<MembershipResponse> => {
    try {
        const url = `${apiDomain}/checkMembership`;
        return await httpClient<MembershipResponse>(url, {method: 'GET'});
    } catch (error) {
        console.error('Error in checkMembership:', error);
        throw error;
    }
};
