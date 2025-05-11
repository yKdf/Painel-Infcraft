import http from '@/api/http';
import { Plugin, Source, Version } from '@/components/server/plugin/types';

export default function (plugin: Plugin): Promise<Version[]> {
    return new Promise((resolve, reject) => {
        switch (plugin.source) {
            case Source.Polymart: {
                http.get(
                    `https://proxy.fyrehost.net/?https://api.polymart.org/v1/getResourceUpdates?resource_id=${plugin.id}`,
                    {
                        withCredentials: false,
                    }
                )
                    .then(
                        ({
                            data: {
                                response: { updates },
                            },
                        }) => {
                            resolve(
                                updates.map((update: any) => ({
                                    externalUrl: update.url,
                                    name: update.title,
                                    downloads: 0,
                                    id: update.id,
                                    description: update.description,
                                    downloadUrl: undefined,
                                }))
                            );
                        }
                    )
                    .catch(reject);
                break;
            }
            case Source.Spigot: {
                http.get(`https://spigot.fyrehost.net/v2/resources/${plugin.id}/versions?sort=-id`, {
                    withCredentials: false,
                })
                    .then(({ data }) => {
                        resolve(
                            data.map((version: any) => ({
                                name: version.name,
                                downloads: version.downloads,
                                id: version.id,
                                description: '',
                                downloadUrl: undefined,
                                rating: version.rating,
                            }))
                        );
                    })
                    .catch(reject);
                break;
            }
            case Source.Modrinth: {
                http.get(`https://modrinth.fyrehost.net/v2/project/${plugin.id}/version`, { withCredentials: false })
                    .then(({ data }) => {
                        resolve(
                            data.map((ver: any) => ({
                                externalUrl: '',
                                name: ver.name,
                                downloads: ver.downloads,
                                id: ver.id,
                                description: ver.changelog,
                                downloadUrl: ver.files[0].url,
                            }))
                        );
                    })
                    .catch(reject);
                break;
            }
        }
    });
}
