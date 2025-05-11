import http from '@/api/http';
import { EggsResponse } from '@/components/AvailableEggsContainer';

export default async (): Promise<EggsResponse> => {
    const { data } = await http.get('/api/client/eggs');

    return (data.data || []);
};
