/* eslint-disable camelcase */
import http from '@/api/http';

export default (serverUuid: string) => {
    return new Promise<void>((resolve, reject) => {
        http.post(`/api/client/servers/${serverUuid}/splitted/splitremove`)
            .then(() => resolve())
            .catch(reject);
    });
};
