import http from '@/api/http';

export interface ImportEggData {
    eggJson: string;
    reinstallServer: boolean;
    autoApply: boolean;
}

export default (uuid: string, data: ImportEggData): Promise<any> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/eggs/import`, {
            json_data: data.eggJson,
            reinstallServer: data.reinstallServer,
            autoApply: data.autoApply,
        })
            .then((response) => {
                resolve(response.data || []);
            })
            .catch(reject);
    });
};
