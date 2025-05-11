import { ServerContext } from '@/state/server';
import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';
import sanitizeHtml from 'sanitize-html';
import { style } from '@/components/PluginInstallerConfig';
import { Version, Plugin, pruneFileName, Source } from './types';
import { Dialog } from '@/components/elements/dialog';
import deleteFiles from '@/api/server/files/deleteFiles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faStarHalf } from '@fortawesome/free-solid-svg-icons';
import downloadFileFromUrl from '@/api/server/files/downloadFileFromUrl';

interface Props {
    version: Version;
    installed: boolean;
    setInstalled: (installed: boolean) => void;
    name: string;
    plugin: Plugin;
    filename: string;
}

export default ({ version, installed, setInstalled, plugin, filename }: Props) => {
    const [open, setOpen] = useState(false);

    const [ratings, setRatings] = useState<JSX.Element[]>();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [versionInstalled, setVersionInstalled] = useState(installed);

    async function downloadPlugin() {
        if (installed) {
            deleteFiles(uuid, '/plugins', [`${filename}.jar`]);

            setInstalled(false);
            setVersionInstalled(false);

            return;
        }

        if (plugin.source === Source.Spigot && !plugin.external) {
            await downloadFileFromUrl(
                uuid,
                `https://spigotmc.fyrehost.net/resources/${plugin.id}/download?version=${version.id}`,
                '/plugins',
                `${pruneFileName(plugin.name)}-S${plugin.id}-${version.id}.jar`
            );

            setInstalled(true);

            setVersionInstalled(true);
        }

        setOpen(true);
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
    }, []);

    return (
        <>
            <Dialog.Confirm
                open={open}
                onClose={() => setOpen(false)}
                title={`Open in New Tab`}
                confirm={'Open'}
                onConfirmed={() => {
                    console.log(version);
                    window.open(version.externalUrl);
                    setOpen(false);
                }}
            >
                Specific versions can only be downloded from the resource&apos;s website.
            </Dialog.Confirm>
            <div style={{ backgroundColor: '#202020' }} css={tw`rounded-lg grid p-4`}>
                <div css={tw`mx-auto`}>Version: {version.name}</div>
                <div hidden={version.downloads === -1} css={tw`mx-auto`}>
                    Downloads: {version.downloads !== undefined ? version.downloads.toLocaleString(undefined) : ''}
                </div>
                <div hidden={!version.rating} css={tw`mx-auto text-yellow-500`}>
                    {ratings}
                </div>
                <div
                    hidden={version.downloads !== -1}
                    css={tw`mx-auto`}
                    dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(version.description, {
                            allowedAttributes: {
                                '*': ['href', 'style', 'target', 'width', 'height', 'src', 'data-url'],
                            },
                        }),
                    }}
                ></div>
                <button css={versionInstalled ? style.buttonUninstall : style.buttonInstall} onClick={downloadPlugin}>
                    {versionInstalled ? 'Uninstalled' : 'Install'}
                </button>
            </div>
        </>
    );
};
