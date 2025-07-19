import http from '@/api/http';
import { Plugin, Source } from '@/components/server/plugin/types';

/**
 * Gets the plugin from the source
 * @param id the id of the plugin
 * @param source where the plugin came from
 */
export default function (id: number | string, source: Source): Promise<Plugin | undefined> {
    return new Promise((resolve, reject) => {
        switch (
            source //Different API call based on which source to get information from
        ) {
            case Source.Spigot: {
                http.get(`https://spigot.fyrehost.net/v2/resources/${id}`, { withCredentials: false })
                    .then(({ data }) => {
                        resolve({
                            id: data.id,
                            name: data.name,
                            tag: data.tag,
                            premium: data.premium,
                            external: data.external,
                            file: data.file,
                            rating: data.rating,
                            icon: data.icon.url,
                            testedVersions: data.testedVersions,
                            price: data.price,
                            currency: data.currency,
                            version: '',
                            creationTime: new Date(data.releaseDate),
                            lastUpdateTime: new Date(data.updateDate),
                            canDownload: false,
                            source: Source.Spigot,
                            versionId: data.version.id,
                            currentVersionId: undefined,
                            downloads: data.downloads,
                        });
                    })
                    .catch(reject);
                break;
            }
            case Source.Modrinth: {
                http.get(`https://modrinth.fyrehost.net/v2/project/${id}`, { withCredentials: false })
                    .then(({ data }) => {
                        resolve({
                            id: data.id,
                            name: data.title,
                            tag: data.description,
                            premium: false,
                            external: false,
                            file: {
                                externalUrl: undefined,
                            },
                            rating: {
                                average: -1,
                            },
                            icon: data.icon_url,
                            testedVersions: data.versions,
                            price: 0,
                            currency: '',
                            version: '',
                            creationTime: new Date(data.published),
                            lastUpdateTime: new Date(data.updated),
                            canDownload: false,
                            source: Source.Modrinth,
                            versionId: -1,
                            currentVersionId: undefined,
                            downloads: data.downloads,
                        });
                    })
                    .catch(reject);
                break;
            }
        }
    });
}
