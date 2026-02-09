import http from '@/api/http';

export default (): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.post('/account/google/unlink')
            .then(() => resolve())
            .catch(reject);
    });
};
