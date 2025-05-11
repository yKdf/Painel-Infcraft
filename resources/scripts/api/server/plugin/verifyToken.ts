import http from '@/api/http';

/**
 * Verifies if a token is valid
 * @param token The auth token
 * @returns Whether the token is valid
 */
export default function (token: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        http.post(`https://api.polymart.org/v1/verifyAuthToken`, `token=${token}`, {
            withCredentials: false,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        })
            .then(
                ({
                    data: {
                        response: {
                            result: { success },
                        },
                    },
                }) => {
                    resolve(success);
                }
            )
            .catch(reject);
    });
}
