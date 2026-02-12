import http from '@/api/http';

interface Response {
    data: {
        url: string | null;
        enabled: boolean;
    };
}

export default (currentPassword: string): Promise<{ url: string | null; enabled: boolean }> => {
    return new Promise((resolve, reject) => {
        http.post<Response>('/api/client/account/google/link-url', { current_password: currentPassword })
            .then(({ data }) => resolve(data.data))
            .catch(reject);
    });
};
