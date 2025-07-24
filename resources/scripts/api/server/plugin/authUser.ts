import http from '@/api/http';

/**
 * Authorizes a user
 * @param service the fqdn of the panel
 * @param returnUrl the url to return the user to
 * @param state random
 */
export default function (
    service: string,
    returnUrl: string,
    state: string
): Promise<{
    url: string;
    token: string;
}> {
    return new Promise((resolve, reject) => {
        http.post(
            `https://api.polymart.org/v1/authorizeUser`,
            {
                service: service,
                return_url: returnUrl,
                return_token: 1,
                state: state,
            },
            {
                withCredentials: false,
            }
        )
            .then(
                ({
                    data: {
                        response: {
                            result: { url, token },
                        },
                    },
                }) => {
                    resolve({
                        url: url,
                        token: token,
                    });
                }
            )
            .catch(reject);
    });
}
