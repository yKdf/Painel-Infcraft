import Button from '@/components/elements/Button';
import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import { ServerContext } from '@/state/server';
import React, { ChangeEvent, useEffect, useState } from 'react';
import tw from 'twin.macro';
import VersionContainer from '@/components/server/plugin/VersionContainer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faStar, faStarHalf } from '@fortawesome/free-solid-svg-icons';
import { Dialog } from '@/components/elements/dialog';
import sanitizeHtml from 'sanitize-html';
import { style } from '@/components/PluginInstallerConfig';
import { pruneFileName, Plugin, Source, Version } from './types';
import getPlugin from '@/api/server/plugin/getPlugin';
import getDownloadUrl from '@/api/server/plugin/getDownloadUrl';
import downloadFileFromUrl from '@/api/server/files/downloadFileFromUrl';
import deleteFiles from '@/api/server/files/deleteFiles';
import getVersions from '@/api/server/plugin/getVersions';
import { FileObject } from '@/api/server/files/loadDirectory';

interface Props {
    plugin: Plugin;
    version: string;
    installedPlugins: FileObject[];
    token: string | null;
}

export default ({ plugin, version, installedPlugins, token }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [installed, setInstalled] = useState(false);

    const [visable, setVisable] = useState(false);

    const [open, setOpen] = useState(false);

    const [details, setDetails] = useState(false);

    const [detailsText, setDetailsText] = useState('');

    const [externalDownload, setExternalDownload] = useState(false);

    const [versions, setVersions] = useState<Version[]>();

    const [ratings, setRatings] = useState<JSX.Element[]>();

    const [page, setPage] = useState(1);

    const [search, setSearch] = useState('');

    const [installedFileName, setInstalledFileName] = useState(''); //The filename of the plugin if it is installed

    const [updateAvailable, setUpdateAvailable] = useState(false);

    const [buttonText, setButtonText] = useState('Install');

    /**
     * Gets the proper text for the button
     */
    function getButtonText() {
        if (installed) {
            if (updateAvailable) {
                setButtonText('Update');
            } else {
                setButtonText('Uninstall');
            }
        } else {
            if (plugin.canDownload) {
                setButtonText('Install');
            } else if (plugin.premium) {
                setButtonText(`Purchase ${plugin.price} ${plugin.currency}`); //Current glitched
            } else {
                setButtonText('Install');
            }
        }
    }

    /**
     * Checks if an update is available
     */
    async function checkUpdateAvailable() {
        if (plugin.currentVersionId === undefined) {
            return;
        }
        switch (plugin.source) {
            case Source.Spigot: {
                const currentPlugin = await getPlugin(plugin.id, Source.Spigot);

                if (!currentPlugin) {
                    return;
                }

                if (plugin.currentVersionId === currentPlugin.versionId) {
                    return;
                }

                setUpdateAvailable(true);
                break;
            }
            case Source.Polymart: {
                const currentPlugin = await getPlugin(plugin.id, Source.Polymart);

                if (!currentPlugin) {
                    return;
                }

                if (plugin.currentVersionId === currentPlugin.versionId) {
                    return;
                }

                setUpdateAvailable(true);
                break;
            }
        }
    }

    /**
     * Gets the plugin image
     * @returns The plugin image data
     */
    function getImage() {
        if (plugin.source === Source.Spigot) {
            return plugin.icon
                ? 'https://spigotmc.fyrehost.net/' + plugin.icon
                : 'https://static.spigotmc.org/styles/spigot/xenresource/resource_icon.png';
        } else {
            return plugin.icon;
        }
    }

    /**
     * Downloads the plugin
     */
    async function downloadPlugin() {
        //If the plugin is already installed remove it
        if (installed) {
            deleteFiles(uuid, '/plugins', [installedFileName]);

            setInstalled(false);

            return;
        }

        //Continue on since the rest of the code simply installs the latest version of the plugin

        //If its Polymart
        if (plugin.source === Source.Polymart) {
            if (!plugin.canDownload) {
                setOpen(true);
                return;
            }

            //Logic for token is handled inside of downloadFileFromUrl
            downloadFileFromUrl(
                uuid,
                await getDownloadUrl(plugin, plugin.id, Source.Polymart, -1, token),
                'plugins/',
                `${pruneFileName(plugin.name)}-P${plugin.id}-${plugin.versionId}.jar`
            );
            setInstalled(true);
            return;
        }

        //If its Modrinth
        if (plugin.source === Source.Modrinth) {
            console.log(await getDownloadUrl(plugin, plugin.id, Source.Modrinth));

            downloadFileFromUrl(
                uuid,
                await getDownloadUrl(plugin, plugin.id, Source.Modrinth),
                'plugins/',
                `${pruneFileName(plugin.name)}-M${plugin.id}-${(await getVersions(plugin))[0].id}.jar`
            );
            setInstalled(true);
            return;
        }

        if (plugin.premium) {
            setOpen(true);
            return;
        }

        if (plugin.external && !plugin.file.externalUrl?.endsWith('.jar')) {
            setExternalDownload(true);
            return;
        }

        if (plugin.external) {
            downloadFileFromUrl(
                uuid,
                plugin.file.externalUrl!,
                'plugins/',
                `${pruneFileName(plugin.name)}-S${plugin.id}-${plugin.versionId}.jar`
            );
        } else {
            downloadFileFromUrl(
                uuid,
                await getDownloadUrl(plugin, plugin.id, Source.Spigot),
                'plugins/',
                `${pruneFileName(plugin.name)}-S${plugin.id}-${plugin.versionId}.jar`
            );
        }

        setInstalled(true);
    }

    /**
     * Checks if the plugin is installed
     * Uses a pruned filename since externally installed plugins will not have an id in the file name
     */
    async function checkInstalled() {
        const plugins = installedPlugins;

        for (let i = 0; i < plugins.length; i++) {
            const name = plugins[i].name;
            if (name.split('.')[0].includes(pruneFileName(plugin.name))) {
                setInstalled(true);
                setInstalledFileName(name);
            }
            if (name.split('-').length === 3 && parseInt(name.split('-')[2].substring(1)) === plugin.id) {
                setInstalled(true);
                setInstalledFileName(name);
            }
        }
    }

    /**
     * Gets versions of the plugin
     */
    async function getPluginVersions() {
        setVersions(await getVersions(plugin));
    }

    /**
     * Gets and renders details of a resource
     */
    async function getDetails() {
        const data: any = await (await fetch(`https://spigot.fyrehost.net/v2/resources/${plugin.id}`)).json();

        const text = data.description;

        let decoded = atob(text);

        decoded = decoded
            .split(`class="bbCodeBlock`)
            .join(`style="background-color: #fbfbfb; border: 1px solid #ccc;" class="`);

        const code = `font-size: 10pt;
        font-family: Consolas,courier new,Courier,monospace;
        w: #fbfbfb;
        background-repeat: repeat-x;
        background-position: top;
        padding-right: 8px;
        padding-left: 8px;
        white-space: nowrap;
        overflow: auto;
        overflow-wrap: normal;
        line-height: 26px;
        min-height: 30px;
        max-height: 500px;
        direction: ltr;
        background-image: -webkit-repeating-linear-gradient(top,rgba(0,0,0,.015) 0px,rgba(0,0,0,.015) 26px,rgba(0,0,0,.045) 26px,rgba(0,0,0,.045) 52px);
        background-image: -moz-repeating-linear-gradient(top,rgba(0,0,0,.015) 0px,rgba(0,0,0,.015) 26px,rgba(0,0,0,.045) 26px,rgba(0,0,0,.045) 52px);
        background-image: -ms-repeating-linear-gradient(top,rgba(0,0,0,.015) 0px,rgba(0,0,0,.015) 26px,rgba(0,0,0,.045) 26px,rgba(0,0,0,.045) 52px);
        background-image: -o-repeating-linear-gradient(top,rgba(0,0,0,.015) 0px,rgba(0,0,0,.015) 26px,rgba(0,0,0,.045) 26px,rgba(0,0,0,.045) 52px);
        background-image: repeating-linear-gradient(top,rgba(0,0,0,.015) 0px,rgba(0,0,0,.015) 26px,rgba(0,0,0,.045) 26px,rgba(0,0,0,.045) 52px);
        color: black;`;

        decoded = decoded.split(`class="BBcodeInlineCode"`).join(`style="font-size: 10pt;
        font-family: Consolas,courier new,Courier,monospace;
        color: #2c2c2c;
        background-color: #e2e5f4;
        padding: 1px;
        margin: 1px;
        border: 1px solid #bbb;
        line-height: 1.4;
        "`);

        decoded = decoded.split(`class="code"`).join(`style="${code}"`);

        const type = `font-size: 12px;
        font-family: droid sans,Arial,sans-serif;
        color: #606060;
        background-color: #fff;
        padding: 8px;
        border-bottom: 1px solid #ccc;`;

        decoded = decoded.split(`class="type"`).join(`style="${type}"`);

        const link = `color: #efb61c;`;

        decoded = decoded.split(`class="externalLink"`).join(`style="${link}"`);

        decoded = decoded.split(`<li>`).join(`<li style="list-style-position:inside; list-style-type: circle;">`);

        decoded = decoded.split(`style="color: rgb`).join(`style="`);

        decoded = decoded.replace(new RegExp('\\/\\/proxy\\.spigotmc\\.org.*data-url\\=\\"', 'g'), '');

        decoded = decoded.split('â').join('');

        decoded = decoded.split('img src="styles/').join('img src="https://spigotmc.org/styles/');

        decoded = decoded.split('img src="').join('img src="https://proxy.fyrehost.net?');

        decoded = sanitizeHtml(decoded, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat([
                'img',
                'b',
                'a',
                'ul',
                'iframe',
                'li',
                'blockquote',
            ]),
            allowedAttributes: {
                '*': ['href', 'style', 'target', 'width', 'height', 'src', 'data-url'],
            },
            allowedIframeHostnames: ['www.youtube.com'],
        });

        setDetailsText(decoded);
    }

    /**
     * Event handling for the searchbar
     * @param event Search event
     */
    function onSearch(event: ChangeEvent<HTMLInputElement>) {
        setSearch(event.target.value);
    }

    /**
     * Converts a numeric value to a string
     * @param value The numeric value
     * @returns The string version
     */
    function intToString(value: number): string {
        const suffixes = ['', 'K', 'M', 'B', 'T'];
        const suffixNum = Math.floor(('' + value).length / 3);
        let shortValue: number | string = parseFloat(
            (suffixNum !== 0 ? value / Math.pow(1000, suffixNum) : value).toPrecision(2)
        );
        if (shortValue % 1 !== 0) {
            shortValue = shortValue.toFixed(1);
        }
        return shortValue + suffixes[suffixNum];
    }

    useEffect(() => {
        const r = [];
        let rating = Math.round(plugin.rating.average * 10);
        while (rating > 0) {
            if (rating >= 10) {
                r.push(<FontAwesomeIcon icon={faStar} key={Math.random()} />);
                rating -= 10;
            } else {
                r.push(<FontAwesomeIcon icon={faStarHalf} key={Math.random()} />);
                rating = 0;
            }
        }
        setRatings(r);
        checkInstalled();
        checkUpdateAvailable();
    }, []);

    useEffect(() => {
        getPluginVersions();
    }, [page, search]);

    useEffect(() => {
        getButtonText();
    }, [installed]);

    useEffect(() => {
        getButtonText();
    }, [updateAvailable]);

    return (
        <>
            <Modal
                visible={visable}
                dismissable
                onDismissed={() => {
                    setVisable(false);
                }}
                css={tw`mb-4`}
            >
                <h1 css={tw`w-full text-center text-2xl`}>{plugin.name}&nbsp;Versions</h1>
                <div css={tw`mt-4 flex px-6 mx-4`}>
                    <Button
                        style={{
                            backgroundColor: style.primaryColor,
                            borderColor: style.secondaryColor,
                        }}
                        disabled={page === 1}
                        onClick={() => {
                            setPage(page - 1);
                        }}
                    >
                        &#60;
                    </Button>
                    <Button
                        style={{
                            backgroundColor: style.primaryColor,
                            borderColor: style.secondaryColor,
                        }}
                        onClick={() => {
                            setPage(page + 1);
                        }}
                    >
                        &#62;
                    </Button>
                    <input
                        onChange={onSearch}
                        css={tw`rounded-lg border-2 text-lg p-2 ml-5 w-full`}
                        style={{
                            backgroundColor: style.primaryColor,
                            borderColor: style.secondaryColor,
                        }}
                        placeholder={'search'}
                    />
                </div>
                {!versions ? (
                    <Spinner size='large' centered></Spinner>
                ) : (
                    <>
                        <div css={tw`mt-4 mx-10 grid gap-4`}>
                            {versions.map((version) => (
                                <VersionContainer
                                    version={version}
                                    installed={installed}
                                    setInstalled={setInstalled}
                                    name={plugin.name}
                                    plugin={plugin}
                                    filename={installedFileName}
                                    key={Math.random()}
                                />
                            ))}
                        </div>
                    </>
                )}
            </Modal>
            <Modal
                visible={details}
                dismissable
                onDismissed={() => {
                    setDetails(false);
                }}
                css={tw`mb-4`}
            >
                <h1 css={tw`w-full text-center text-3xl`}>{plugin.name}</h1>
                {detailsText ? (
                    <div dangerouslySetInnerHTML={{ __html: detailsText }}></div>
                ) : (
                    <Spinner centered={true} size='large' />
                )}
            </Modal>

            <div style={{ backgroundColor: style.primaryColor }} css={style.entryStyle}>
                <div css={tw`bg-transparent p-2 overflow-hidden`}>
                    <button
                        css={tw`flex`}
                        disabled={plugin.source !== Source.Spigot}
                        onClick={(e) => {
                            e.preventDefault();
                            setDetails(true);
                            getDetails();
                        }}
                    >
                        <img css={tw`hidden 2xl:block w-32 h-32 p-2`} src={getImage()}></img>
                        <div css={tw`mx-auto`}>
                            <span css={tw`inline`}>
                                <div css={tw`text-2xl mx-auto text-center truncate flex`}>
                                    <div css={tw`text-center w-full`}>{plugin.name.substring(0, 20)}</div>
                                    <div
                                        title={
                                            plugin.testedVersions.length === 0
                                                ? 'This plugin has reported no tested version.'
                                                : plugin.testedVersions.join(',').includes(version) || version === 'Any'
                                                ? 'This addon has been tested with your version.'
                                                : 'This addon has not been tested with your version.'
                                        }
                                    >
                                        {version === 'Any'
                                            ? ''
                                            : plugin.testedVersions.length === 0
                                            ? '⚠️'
                                            : plugin.testedVersions.join(',').includes(version)
                                            ? '✔️'
                                            : '❌'}
                                    </div>
                                </div>
                                <div css={tw`flex px-12`}>
                                    <div
                                        css={tw`my-2 mx-auto place-self-center text-yellow-500`}
                                        title={`${Math.round(plugin.rating.average * 10) / 10} out of 5 stars`}
                                    >
                                        {ratings}
                                    </div>
                                    <div css={tw`mx-auto my-2`}>
                                        <FontAwesomeIcon icon={faDownload} />
                                        &nbsp;
                                        {intToString(plugin.downloads)}
                                    </div>
                                </div>
                            </span>
                            <p css={tw`text-center`} style={{ textOverflow: 'ellipsis' }}>
                                {plugin.tag}
                            </p>
                        </div>
                    </button>

                    <div css={tw`flex`}>
                        <button
                            css={
                                installed
                                    ? updateAvailable
                                        ? style.buttonUpdate
                                        : style.buttonUninstall
                                    : style.buttonInstall
                            }
                            onClick={downloadPlugin}
                        >
                            {buttonText}
                        </button>
                        <Dialog.Confirm
                            open={externalDownload}
                            onClose={() => setExternalDownload(false)}
                            title={`Open in New Tab`}
                            confirm={'Open'}
                            onConfirmed={() => {
                                window.open(plugin.file.externalUrl!);
                                setExternalDownload(false);
                            }}
                        >
                            This author has an external website to download their resource.
                        </Dialog.Confirm>
                        <Dialog.Confirm
                            open={open}
                            onClose={() => setOpen(false)}
                            title={`Open in New Tab`}
                            confirm={'Open'}
                            onConfirmed={() => {
                                if (plugin.source !== Source.Spigot) {
                                    window.open(plugin.file.externalUrl!);
                                    setOpen(false);
                                    return;
                                }
                                window.open(`https://spigotmc.org/resources/${plugin.name}.${plugin.id}`);
                                setOpen(false);
                            }}
                        >
                            This will open the resource page in a new tab.
                        </Dialog.Confirm>
                        <button
                            css={style.openExternal}
                            onClick={() => {
                                setOpen(true);
                            }}
                        >
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                css={tw`h-8 w-8 m-auto`}
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='white'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
                                />
                            </svg>
                        </button>
                    </div>
                    <button
                        css={style.versionsButton}
                        onClick={() => {
                            setSearch('');
                            setVisable(true);
                            getPluginVersions();
                        }}
                    >
                        Versions
                    </button>
                </div>
            </div>
        </>
    );
};
