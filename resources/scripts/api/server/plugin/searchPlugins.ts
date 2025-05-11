import http from '@/api/http';
import { config } from '@/components/PluginInstallerConfig';
import { Plugin, Source } from '@/components/server/plugin/types';
import getPlugin from './getPlugin';

/**
 * Gets a polymart plugin with extra details
 * @param id Id of the plugin
 * @param canDownload If the user can download the plugin (premium resources)
 * @param url The url of the plugin
 * @returns The plugin
 */
async function getPolymartPlugin(id: number, canDownload: boolean, url: string): Promise<Plugin> {
    const req: Plugin = (await getPlugin(id, Source.Polymart)) as Plugin;

    return {
        id: req.id,
        name: req.name,
        tag: req.tag,
        premium: !(req.price === 0),
        external: canDownload,
        file: {
            externalUrl: url,
        },
        rating: {
            average: req.rating.average,
        },
        icon: req.icon,
        testedVersions: req.testedVersions,
        price: req.price,
        currency: req.currency,
        version: req.version,
        creationTime: req.creationTime,
        lastUpdateTime: req.lastUpdateTime,
        canDownload: canDownload,
        source: Source.Polymart,
        versionId: req.versionId,
        currentVersionId: undefined,
        downloads: req.downloads,
    };
}

/**
 * Searches for a plugin
 * @param search The term to search for
 * @param source The source to get the plugin from
 * @param category The categories to look through (only Spigot)
 * @param page The page number
 * @param polymartToken The polymart token, if applicable
 */
export default function (
    search: string,
    source: Source,
    category: number,
    page: number,
    polymartToken?: string
): Promise<Plugin[]> {
    return new Promise((resolve, reject) => {
        switch (source) {
            case Source.Spigot: {
                //default
                let url = `https://spigot.fyrehost.net/v2/resources?size=${config.amountPerPage}&sort=-downloads&page=${page}`;

                //If the user is seaching for something
                if (search.length > 0) {
                    url = `https://spigot.fyrehost.net/v2/search/resources/${search}?size=${config.amountPerPage}&page=${page}&fields=price`;
                } else if (category !== 0) {
                    //If a category is selected the user cannot search for a term
                    url = `https://spigot.fyrehost.net/v2/categories/${category}/resources?size=${config.amountPerPage}&sort=-downloads&page=${page}`;
                }

                http.get(url, { withCredentials: false })
                    .then(({ data }) => {
                        resolve(
                            data.map((plugin: any) => ({
                                id: plugin.id,
                                name: plugin.name,
                                tag: plugin.tag,
                                premium: plugin.premium,
                                external: plugin.file.type === 'external',
                                file: plugin.file,
                                rating: plugin.rating,
                                icon: plugin.icon.url,
                                testedVersions: plugin.testedVersions,
                                price: plugin.price,
                                currency: plugin.currency,
                                version: '',
                                creationTime: new Date(plugin.releaseDate),
                                lastUpdateTime: new Date(plugin.updateDate),
                                canDownload: false,
                                source: Source.Spigot,
                                versionId: plugin.version.id,
                                currentVersionId: undefined,
                                downloads: plugin.downloads,
                            }))
                        );
                    })
                    .catch(reject);
                break;
            }
            case Source.Polymart: {
                let url = `https://api.polymart.org/v1/search?limit=${config.amountPerPage}&referrer=${
                    config.polymartReferral
                }&start=${(page - 1) * config.amountPerPage + 1}`;

                if (search.length > 0) {
                    url = `https://api.polymart.org/v1/search?limit=${config.amountPerPage}&referrer=${
                        config.polymartReferral
                    }&start=${(page - 1) * config.amountPerPage + 1}&query=${search}`;
                }

                if (polymartToken) {
                    url += `&token=${polymartToken}`;
                }

                http.post(url, JSON.stringify({ token: polymartToken ? polymartToken : '' }), {
                    withCredentials: false,
                })
                    .then(
                        ({
                            data: {
                                response: { result },
                            },
                        }) => {
                            const res: Promise<Plugin>[] = result.map((plugin: any) =>
                                getPolymartPlugin(plugin.id, plugin.canDownload, plugin.url)
                            );

                            resolve(Promise.all(res));
                        }
                    )
                    .catch(reject);
                break;
            }
            case Source.Modrinth: {
                http.get(
                    `https://modrinth.fyrehost.net/v2/search?index=downloads&offset=${
                        (page - 1) * 16
                    }&facets=[["categories:'bukkit'","categories:'spigot'","categories:'paper'","categories:'purpur'","categories:'sponge'","categories:'bungeecord'","categories:'waterfall'","categories:'velocity'"],["project_type:mod"]]&limit=${
                        config.amountPerPage
                    }&query=${search}`,
                    {
                        withCredentials: false,
                    }
                )
                    .then(({ data: { hits } }) => {
                        resolve(
                            hits.map((pl: any) => ({
                                id: pl.project_id,
                                name: pl.title,
                                tag: pl.description,
                                premium: false,
                                external: false,
                                file: {
                                    externalUrl: undefined,
                                },
                                rating: {
                                    average: -1,
                                },
                                icon: pl.icon_url,
                                testedVersions: pl.versions,
                                price: 0,
                                currency: '',
                                version: '',
                                creationTime: new Date(pl.date_created),
                                lastUpdateTime: new Date(pl.date_modified),
                                canDownload: false,
                                source: Source.Modrinth,
                                versionId: pl.versions[0],
                                currentVersionId: undefined,
                                downloads: pl.downloads,
                            }))
                        );
                    })
                    .catch(reject);
                break;
            }
        }
    });
}
