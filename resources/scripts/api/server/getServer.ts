import http, { FractalResponseData, FractalResponseList } from '@/api/http';
import { rawDataToServerAllocation, rawDataToServerEggVariable } from '@/api/transformers';
import { ServerEggVariable, ServerStatus } from '@/api/server/types';

export interface Allocation {
    id: number;
    ip: string;
    alias: string | null;
    port: number;
    notes: string | null;
    isDefault: boolean;
}

export interface Server {
    id: string;
    internalId: number | string;
    uuid: string;
    name: string;
    expDate: string;
    node: string;
    eggName: string;
    isNodeUnderMaintenance: boolean;
    status: ServerStatus;
    sftpDetails: {
        ip: string;
        port: number;
    };
    invocation: string;
    dockerImage: string;
    description: string;
    limits: {
        memory: number;
        swap: number;
        disk: number;
        io: number;
        cpu: number;
        threads: string;
    };
    eggFeatures: string[];
    featureLimits: {
        splittedLimit: number;
        databases: number;
        allocations: number;
        backups: number;
    };
    isTransferring: boolean;
    variables: ServerEggVariable[];
    allocations: Allocation[];
    nestId: number;
    eggId: number;
}

export const rawDataToServerObject = ({ attributes: data }: FractalResponseData): Server => ({
    id: data.identifier,
    internalId: data.internal_id,
    uuid: data.uuid,
    name: data.name,
    expDate: data.exp_date,
    node: data.node,
    eggName: data.egg_name,
    isNodeUnderMaintenance: data.is_node_under_maintenance,
    status: data.status,
    invocation: data.invocation,
    dockerImage: data.docker_image,
    sftpDetails: {
        ip: data.sftp_details.ip,
        port: data.sftp_details.port,
    },
    description: data.description ? (data.description.length > 0 ? data.description : null) : null,
    limits: { ...data.limits },
    eggFeatures: data.egg_features || [],
    featureLimits: { ...data.feature_limits },
    isTransferring: data.is_transferring,
    variables: ((data.relationships?.variables as FractalResponseList | undefined)?.data || []).map(
        rawDataToServerEggVariable
    ),
    allocations: ((data.relationships?.allocations as FractalResponseList | undefined)?.data || []).map(
        rawDataToServerAllocation
    ),
    nestId: data.nest_id,
    eggId: data.egg_id,
});

export default (uuid: string): Promise<[Server, string[]]> => {
    return new Promise((resolve, reject) => {
        http.get(`/api/client/servers/${uuid}`)
            .then(({ data }) =>
                resolve([
                    rawDataToServerObject(data),
                    // eslint-disable-next-line camelcase
                    data.meta?.is_server_owner ? ['*'] : data.meta?.user_permissions || [],
                ])
            )
            .catch(reject);
    });
};
