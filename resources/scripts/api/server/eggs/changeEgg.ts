import http from '@/api/http';

export default (uuid: string, eggId: number, reinstallServer: boolean): Promise<any> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/eggs/change`, {
            eggId, reinstallServer,
        }).then((data) => {
            resolve(data.data || []);
        }).catch(reject);
    });
};
