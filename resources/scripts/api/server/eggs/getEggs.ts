import http from '@/api/http';

export interface EggsResponse {
    eggs: any[];
    currentEggId: number;
}

export default async (uuid: string): Promise<EggsResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/eggs`);

    return data.data || [];
};
