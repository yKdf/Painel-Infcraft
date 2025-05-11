import http from '@/api/http';
import { EggsResponse } from '@/components/server/eggs/EggsContainer';

export default async (uuid: string): Promise<EggsResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/eggs`);

    return (data.data || []);
};
