import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFileArchive, faFileImport, faFolder } from '@fortawesome/free-solid-svg-icons';
import { encodePathSegments } from '@/helpers';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import { FileObject } from '@/api/server/files/loadDirectory';
import FileDropdownMenu from '@/components/server/files/FileDropdownMenu';
import { ServerContext } from '@/state/server';
import { NavLink, useRouteMatch } from 'react-router-dom';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';
import SelectFileCheckbox from '@/components/server/files/SelectFileCheckbox';
import { usePermissions } from '@/plugins/usePermissions';
import { join } from 'path';
import { bytesToString } from '@/lib/formatters';
import styles from './style.module.css';
import { Source } from '@/components/server/plugin/types';

const Clickable: React.FC<{ file: FileObject }> = memo(({ file, children }) => {
    const [canReadContents] = usePermissions(['file.read-content']);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const match = useRouteMatch();

    function generateTitle(): string {
        const filename = file.name;
        if (filename.split('-').length !== 3) {
            return '';
        }
        if (!'SP'.includes(filename.split('-')[1].split('')[0])) {
            return '';
        }

        return `Plugin Name: ${filename.split('-')[0]}\nPlugin ID: ${filename
            .split('-')[1]
            .substring(1)}\nVersion ID: ${filename.split('-')[2].split('.')[0]}`;
    }

    return !canReadContents || (file.isFile && !file.isEditable()) ? (
        <div title={generateTitle()}>{children}</div>
    ) : (
        <NavLink to={`${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}`}>
            {children}
        </NavLink>
    );
}, isEqual);

const getSource = (filename: string): Source | undefined => {
    if (filename.split('-').length !== 3) {
        return undefined;
    }
    if (!'SPM'.includes(filename.split('-')[1].split('')[0])) {
        return undefined;
    }
    if (filename.split('-')[1].split('')[0] === 'M') {
        return Source.Modrinth;
    }
    return Source.Spigot;
};

const open = (filename: string) => {
    const source = getSource(filename);
    if (source === Source.Spigot) {
        window.open(`https://www.spigotmc.org/resources/${filename.split('-')[1].substring(1)}/`, '_blank');
    }
    if (source === Source.Modrinth) {
        window.open(`https://modrinth.com/plugin/${filename.split('-')[0]}`, '_blank');
    }
};

const FileObjectGrid = ({ file }: { file: FileObject }) => (
    <div
        className={styles.file_grid}
        key={file.name}
        onContextMenu={(e) => {
            e.preventDefault();
            window.dispatchEvent(
                new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: { x: e.clientX, y: e.clientY } })
            );
        }}
    >
        <div css={tw`absolute top-2 left-2`}>
            <SelectFileCheckbox name={file.name} />
        </div>

        <Clickable file={file}>
            <div css={tw`flex flex-col items-center space-y-2`}>
                <div css={tw`text-neutral-400 text-3xl`}>
                    {file.isFile ? (
                        <FontAwesomeIcon
                            icon={file.isSymlink ? faFileImport : file.isArchiveType() ? faFileArchive : faFileAlt}
                        />
                    ) : (
                        <FontAwesomeIcon icon={faFolder} />
                    )}
                </div>

                <div className={styles.file_name_container}>
                    <div className={file.name.length > 20 ? styles.file_name_long : styles.file_name_short}>
                        {file.name}
                    </div>
                </div>

                {file.isFile && <div className={styles.size}>{bytesToString(file.size)}</div>}

                <div css={tw`text-xs text-neutral-500`} title={file.modifiedAt.toString()}>
                    {Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48
                        ? format(file.modifiedAt, 'MMM do, yyyy')
                        : formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
                </div>
            </div>
        </Clickable>
        <div css={tw`absolute top-2 right-2`}>
            <FileDropdownMenu file={file} />
        </div>

        {getSource(file.name) && (
            <button
                css={tw`absolute bottom-2 right-2`}
                onClick={() => {
                    open(file.name);
                }}
            >
                {getSource(file.name) === Source.Spigot && (
                    <img src='/utils/plugininstaller/spigot.png' css={tw`h-6 w-6`} />
                )}
                {getSource(file.name) === Source.Modrinth && (
                    <img src='/utils/plugininstaller/modrinth.png' css={tw`h-6 w-6`} />
                )}
            </button>
        )}
    </div>
);

export default memo(FileObjectGrid, (prevProps, nextProps) => {
    return prevProps.file.key === nextProps.file.key;
});
