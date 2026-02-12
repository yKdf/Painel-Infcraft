import http from '@/api/http';

export default (currentPassword: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.delete('/api/client/account/google', { data: { current_password: currentPassword } })
            .then(() => resolve())
            .catch(reject);
    });
};
