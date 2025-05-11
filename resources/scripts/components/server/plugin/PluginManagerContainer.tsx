import http from '@/api/http';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import authUser from '@/api/server/plugin/authUser';
import getPlugin from '@/api/server/plugin/getPlugin';
import searchPlugins from '@/api/server/plugin/searchPlugins';
import verifyToken from '@/api/server/plugin/verifyToken';
import Modal from '@/components/elements/Modal';
import Spinner from '@/components/elements/Spinner';
import { style, config } from '@/components/PluginInstallerConfig';
import { ServerContext } from '@/state/server';
import Icon from '@/components/elements/Icon';
import React, { ChangeEvent, useEffect, useState } from 'react';

import tw from 'twin.macro';
import PluginContainer from './PluginContainer';
import { Plugin, pruneFileName, Source } from './types';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import Dialog from '@/components/elements/dialog/Dialog';
import ConfirmationDialog from '@/components/elements/dialog/ConfirmationDialog';

export default () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name); //Name of the server

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid); //UUID of the server

    const [plugins, setPlugins] = useState<Plugin[]>(); //Data of currently displayed plugins

    const [installedPlugins, setInstalledPlugins] = useState<FileObject[]>(); //Rendered plugins

    const [search, setSearch] = useState(''); //Current search string

    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);

    const [category, setCategory] = useState(0);

    const [version, setVersion] = useState('Any');

    const [polymartAuth, setPolymartAuth] = useState(false);

    const [storageMethod, setStorageMethod] = useState('local');

    const [polymartLogin, setPolymartLogin] = useState(false);

    const [noPluginsFolder, setNoPluginsFolder] = useState(false);

    const [polymartConfirm, setPolymartConfirm] = useState(false);

    const [tempPolymartToken, setTempPolymartToken] = useState('');

    /**
     * Checks what type of token it is
     */
    function checkToken() {
        if (localStorage.getItem('POLYMART_API_TOKEN') !== null) {
            setPolymartAuth(true);
            setStorageMethod('local');
        }
        if (sessionStorage.getItem('POLYMART_API_TOKEN') !== null) {
            setPolymartAuth(true);
            setStorageMethod('session');
        }
    }

    /**
     * Saves the token
     * @param token token to save
     */
    function saveToken(token: string) {
        if (storageMethod === 'local') {
            localStorage.setItem('POLYMART_API_TOKEN', token);
        } else {
            sessionStorage.setItem('POLYMART_API_TOKEN', token);
        }
    }

    /**
     * Removes the token from storage
     */
    function removeToken() {
        if (storageMethod === 'local') {
            localStorage.removeItem('POLYMART_API_TOKEN');
        } else {
            sessionStorage.removeItem('POLYMART_API_TOKEN');
        }
        setPolymartAuth(false);
    }

    /**
     * Gets the Polymart token
     * @returns Polymart token
     */
    function getToken(): string {
        if (storageMethod === 'local') {
            return localStorage.getItem('POLYMART_API_TOKEN')!;
        } else {
            return sessionStorage.getItem('POLYMART_API_TOKEN')!;
        }
    }

    async function getDefaultPage(): Promise<Plugin[]> {
        //Looking for installed plugins
        if (category === 10) {
            const plugins = await http.get(`/api/client/servers/${uuid}/files/list?directory=%2Fplugins`);

            //The plugins that are installed
            const p: Plugin[] = [];

            for (let i = 0; i < plugins.data.data.length; i++) {
                //Plugin name
                const name = plugins.data.data[i].attributes.name.split('.jar')[0];

                //Checks if file name is in plugin installer name format
                if (name.match('.*-(P[0-9]*|S[0-9]*|M[a-zA-Z0-9]*)')) {
                    //Checks which plugin engine
                    switch (name.split('-')[1].substring(0, 1)) {
                        //Spigot
                        case 'S': {
                            //Gets id of plugin
                            const id = parseInt(name.split('-')[1].substring(1));

                            //Gets the version the plugin is on
                            const version = parseInt(name.split('-')[2]);

                            const plugin = await getPlugin(id, Source.Spigot); //Gets the plugin data

                            if (!plugin) {
                                continue;
                            }

                            plugin.currentVersionId = version; //Sets the version

                            //Stores the plugin data
                            p.push(plugin);

                            break;
                        }
                        //Polymart
                        case 'P': {
                            //Gets id of plugin
                            const id = name.split('-')[1].substring(1);

                            //Gets the version the plugin is on
                            const version = parseInt(name.split('-')[2]);

                            const plugin = await getPlugin(id, Source.Polymart); //Gets the plugin data

                            if (!plugin) {
                                continue;
                            }

                            plugin.currentVersionId = version; //Sets the version

                            //Storages the plugin data
                            p.push(plugin);

                            break;
                        }
                        //Modrinth
                        case 'M': {
                            //Gets id of plugin
                            const id = name.split('-')[1].substring(1);

                            //Gets the version the plugin is on
                            const version = name.split('-')[2];

                            const plugin = await getPlugin(id, Source.Modrinth); //Gets the plugin data

                            if (!plugin) {
                                continue;
                            }

                            plugin.currentVersionId = version;

                            p.push(plugin);

                            break;
                        }
                    }
                } //If the plugin is not formatted in the currently method that plugin installer uses, try to guess which plugin it is
                else {
                    //Searches for the plugin on Spigot to find it
                    let req = await fetch(
                        `https://spigot.fyrehost.net/v2/search/resources/${
                            plugins.data.data[i].attributes.name.split('.')[0].split('-')[0]
                        }?size=1`
                    );

                    //Backwards compatibility for old plugin installer naming method - Could cause issues with future engines
                    if (plugins.data.data[i].attributes.name.includes('-')) {
                        req = await fetch(
                            `https://spigot.fyrehost.net/v2/resources/${
                                plugins.data.data[i].attributes.name.split('-')[1].split('.')[0]
                            }?size=1`
                        );
                    }

                    //Checks if the request was successful
                    if (req.status !== 200) {
                        continue;
                    }

                    //Gets the data
                    const json = await req.json();

                    //If the search method was used the response is an array, if the resource ID was searched for the response is an object
                    const res = json instanceof Array ? json[0] : json;

                    const plug: Plugin = {
                        id: res.id,
                        name: res.name,
                        tag: res.tag,
                        premium: res.premium,
                        external: res.external,
                        file: res.file,
                        rating: res.rating,
                        icon: res.icon.data,
                        testedVersions: res.testedVersions,
                        price: res.price,
                        currency: res.currency,
                        version: '',
                        creationTime: new Date(res.releaseDate),
                        lastUpdateTime: new Date(res.updateDate),
                        canDownload: false,
                        source: Source.Spigot,
                        versionId: res.version.id,
                        currentVersionId: undefined,
                        downloads: res.downloads,
                    };

                    if (!name.split('.')[0].includes(pruneFileName(plug.name))) {
                        continue;
                    }

                    p.push(plug);
                }
            }

            return p;
        }

        return await searchPlugins(
            search,
            category === 15 ? Source.Polymart : category === 16 ? Source.Modrinth : Source.Spigot,
            category,
            page,
            getToken()
        );
    }

    /**
     * Gets the default plugins page
     */
    async function setPluginsDefault() {
        setPlugins([]);

        const startSearch = search;

        const p = await getDefaultPage();

        if (startSearch !== search) {
            return;
        }
        setPlugins(p);
    }

    /**
     * Gets installed plugins
     */
    async function render() {
        const ip = await loadDirectory(uuid, 'plugins/').catch(() => {
            setNoPluginsFolder(true);
        });

        if (!ip) {
            return;
        }

        setInstalledPlugins(ip);
    }

    /**
     * Sets the search state
     * @param event The event fired when the button is clicked
     */
    function onSearch(event: ChangeEvent<HTMLInputElement>) {
        if (category !== 15 && category !== 16) {
            setCategory(0);
        }
        setSearch(event.target.value);
    }

    /**
     * Increases the page
     */
    function increasePage() {
        setPage(page + 1);
    }

    /**
     * Decreases the page
     */
    function decreasePage() {
        setPage(page - 1);
    }

    /**
     * Starts the polymart authentication
     */
    async function submitPolymart() {
        setLoading(true);

        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < charactersLength; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        const res = await authUser(window.location.origin, window.location.origin, result);

        window.open(res.url);

        setTempPolymartToken(res.token);

        setPolymartLogin(false);

        setPolymartConfirm(true);
    }

    async function checkPolymart() {
        if (await verifyToken(tempPolymartToken)) {
            setLoading(false);
            setPolymartAuth(true);
            saveToken(tempPolymartToken);
        }

        setPolymartConfirm(false);
    }

    useEffect(() => {
        document.title = `${name} | Plugin Manager`;

        checkToken();
    }, []);

    useEffect(() => {
        render();
    }, []);

    useEffect(() => {
        setPluginsDefault();
    }, [search, page, category]);

    if (noPluginsFolder) {
        return (
            <>
                <div css={tw`flex items-center justify-center w-full my-4`}>
                    <div css={tw`flex items-center bg-neutral-900 rounded p-3 text-red-500`}>
                        <Icon icon={faExclamationTriangle} css={tw`h-4 w-auto mr-2`} />
                        <p css={tw`text-sm text-neutral-100`}>
                            No plugins folder found. Please create a plugins folder before installing plugins.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <ConfirmationDialog open={polymartConfirm} onClose={checkPolymart} onConfirmed={checkPolymart}>
                Have you logged into Polymart?
            </ConfirmationDialog>
            <Modal
                visible={polymartLogin}
                onDismissed={() => {
                    setPolymartLogin(false);
                }}
            >
                <img src={'https://polymart.org/style/logoLight.png'} css={tw`mx-auto`}></img>
                <p css={tw`text-center text-2xl font-semibold`}>
                    Login with Polymart to download resources you have purchased.
                </p>
                <br />
                <div css={tw`text-center`}>
                    <p css={tw`text-2xl font-medium`}>How your info is managed:</p>
                    Does NOT store access to your Polymart account. <br />
                    The access token is stores in your browser&apos;s storage. <br />
                    Your token can only be used to download resources. <br />
                </div>
                <br />
                <br />
                <br />
                <br />
                <div css={tw`text-center`}>
                    <p css={tw`text-2xl font-medium text-red-500`}>Important</p>
                    After your sign in, confirm, and return to the panel, You will see a error. <br />
                    Do not worry, close the tab and return here where you will be signed into Polymart.
                </div>
                <br />
                <br />
                <div css={tw`flex w-full`}>
                    <p css={tw`ml-auto`}>Local Storage</p>
                    <div
                        css={tw`relative inline-block w-10 ml-2 mr-2 align-middle select-none transition duration-200 ease-in`}
                    >
                        <input
                            onChange={() => {
                                setStorageMethod(storageMethod === 'local' ? 'session' : 'local');
                            }}
                            type='checkbox'
                            name='toggle'
                            id='toggle'
                            css={tw`checked:right-0 absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer`}
                        />
                        <label
                            htmlFor='toggle'
                            css={tw`checked:right-0 block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer`}
                        ></label>
                    </div>
                    <p css={tw`mr-auto`}>Session Storage</p>
                </div>
                <p css={tw`text-center`}>
                    {storageMethod === 'local'
                        ? 'Your account info will be stored in this browser until you log out.'
                        : 'Your account info will be stored in this browser until you close the tab.'}
                </p>
                <br />
                <button
                    onClick={submitPolymart}
                    css={tw`text-lg bg-green-500 hover:bg-green-400 text-white w-full rounded-lg p-1 mx-auto border-2 border-green-600`}
                >
                    Login
                </button>
            </Modal>
            <div css={tw`mx-auto my-5`}>
                <div css={tw`mx-10 flex flex-wrap sm:flex-nowrap`}>
                    <div
                        className={`flex w-full sm:w-auto my-2 sm:my-0 ${style.rounding ?? ''} border-${
                            style.inputBorder
                        }`}
                        style={{
                            backgroundColor: style.primaryColor,
                            borderColor: style.secondaryColor,
                        }}
                    >
                        <button
                            style={{
                                backgroundColor: style.primaryColor,
                                borderColor: style.secondaryColor,
                            }}
                            css={tw`w-full sm:w-8 rounded-l-full hover:font-black`}
                            disabled={page === 1}
                            onClick={decreasePage}
                        >
                            &#60;
                        </button>
                        <div
                            style={{
                                backgroundColor: style.primaryColor,
                                borderColor: style.secondaryColor,
                            }}
                            css={tw`text-2xl pt-2 border-0 h-12 w-full sm:w-8 text-center`}
                        >
                            {page}
                        </div>
                        <button
                            style={{
                                backgroundColor: style.primaryColor,
                                borderColor: style.secondaryColor,
                            }}
                            css={tw`w-full sm:w-8 rounded-r-full hover:font-black`}
                            disabled={plugins && plugins.length < config.amountPerPage}
                            onClick={increasePage}
                        >
                            &#62;
                        </button>
                    </div>
                    <input
                        onChange={onSearch}
                        className={`bg-neutral-700 border-${
                            style.inputBorder
                        } text-lg p-2 pl-4 sm:ml-5 w-full my-2 sm:my-0 ${style.rounding ?? ''}`}
                        style={{
                            backgroundColor: style.primaryColor,
                            borderColor: style.secondaryColor,
                        }}
                        placeholder={'Search'}
                    />
                    {/* Login button

                    <button
                        onClick={() => {
                            if (polymartAuth) {
                                removeToken();
                                return;
                            }
                            setPolymartLogin(true);
                        }}
                        style={{
                            backgroundColor: style.primaryColor,
                            borderColor: style.secondaryColor,
                        }}
                        className={`${style.rounding ?? ''} bg-neutral-700 border-${
                            style.inputBorder
                        } text-lg p-2 sm:ml-5 flex my-2 sm:my-0 w-full sm:w-auto mx-auto`}
                    >
                        {loading ? <Spinner size='small' /> : polymartAuth ? 'Logout' : 'Login'}
                        <img
                            src='https://polymart.org/style/logoLight.png'
                            css={tw`hidden 2xl:block h-7 w-48 ml-2`}
                        ></img>
                    </button>
                    */}
                    <select
                        style={{
                            backgroundColor: style.primaryColor,
                            borderColor: style.secondaryColor,
                        }}
                        className={`${style.rounding ?? ''} bg-neutral-700 border-${
                            style.inputBorder
                        } text-lg p-2 sm:ml-5 my-2 sm:my-0 w-full sm:w-auto text-center`}
                        value={version}
                        onChange={(event) => {
                            setVersion(event.target.value);
                        }}
                    >
                        <option value={'Any'}>Any</option>
                        <option value={'1.7'}>1.7</option>
                        <option value={'1.8'}>1.8</option>
                        <option value={'1.9'}>1.9</option>
                        <option value={'1.10'}>1.10</option>
                        <option value={'1.11'}>1.11</option>
                        <option value={'1.12'}>1.12</option>
                        <option value={'1.13'}>1.13</option>
                        <option value={'1.14'}>1.14</option>
                        <option value={'1.15'}>1.15</option>
                        <option value={'1.16'}>1.16</option>
                        <option value={'1.17'}>1.17</option>
                        <option value={'1.18'}>1.18</option>
                        <option value={'1.19'}>1.19</option>
                        <option value={'1.20'}>1.20</option>
                        <option value={'1.20.6'}>1.20.6</option>
                        <option value={'1.21'}>1.21</option>
                    </select>
                    <select
                        style={{
                            backgroundColor: style.primaryColor,
                            borderColor: style.secondaryColor,
                        }}
                        className={`${style.rounding ?? ''} bg-neutral-700 border-${
                            style.inputBorder
                        } text-lg p-2 sm:ml-5 my-2 sm:my-0 w-full sm:w-auto text-center`}
                        value={category}
                        onChange={(event) => {
                            setCategory(parseInt(event.target.value));
                        }}
                    >
                        <option value={0}>none</option>
                        <option value={2}>Bungee - Spigot</option>
                        <option value={3}>Bungee - Proxy</option>
                        <option value={4}>Spigot</option>
                        <option value={5}>Transportation</option>
                        <option value={6}>Chat</option>
                        <option value={7}>Tools and Utilities</option>
                        <option value={8}>Misc</option>
                        <option value={9}>Libararies / APIs</option>
                        <option value={15}>Polymart</option>
                        <option value={16}>Modrinth</option>
                        <option value={10}>Installed</option>
                    </select>
                </div>
                {!plugins || plugins.length === 0 ? (
                    <Spinner size='large' centered></Spinner>
                ) : (
                    <>
                        <div css={style.plugins}>
                            {plugins.map((plug) => (
                                <PluginContainer
                                    plugin={plug}
                                    version={version}
                                    installedPlugins={installedPlugins ? installedPlugins : []}
                                    key={Math.random()}
                                    token={getToken()}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};
