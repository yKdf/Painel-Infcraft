import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFileArchive, faFileImport, faFolder } from '@fortawesome/free-solid-svg-icons';
import { encodePathSegments } from '@/helpers';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import React, { memo } from 'react';
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
import { Source } from '../plugin/types';

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
        <div title={generateTitle()} className={styles.details}>
            {children}
        </div>
    ) : (
        <NavLink
            className={styles.details}
            to={`${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}`}
        >
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
    if (filename.split('-')[1].split('')[0] === 'P') {
        return Source.Polymart;
    }
    if (filename.split('-')[1].split('')[0] === 'M') {
        return Source.Modrinth;
    }
    return Source.Spigot;
};

const open = (filename: string) => {
    switch (getSource(filename)) {
        case Source.Polymart: {
            window.open(`https://polymart.org/resource/${filename.split('-')[1].substring(1)}`);
            break;
        }
        case Source.Spigot: {
            window.open(`https://spigotmc.org/resources/${filename.split('-')[1].substring(1)}`);
            break;
        }
        case Source.Modrinth: {
            window.open(`https://modrinth.com/plugin/${filename.split('-')[1].substring(1)}`);
        }
    }
};

const FileObjectRow = ({ file }: { file: FileObject }) => (
    <div
        className={styles.file_row}
        key={file.name}
        onContextMenu={(e) => {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: e.clientX }));
        }}
    >
        <SelectFileCheckbox name={file.name} />
        <Clickable file={file}>
            <div css={tw`flex-none text-neutral-400 ml-6 mr-4 text-lg pl-3`}>
                {file.isFile ? (
                    <FontAwesomeIcon
                        icon={file.isSymlink ? faFileImport : file.isArchiveType() ? faFileArchive : faFileAlt}
                    />
                ) : (
                    <FontAwesomeIcon icon={faFolder} />
                )}
            </div>
            <div css={tw`flex-1 truncate`}>{file.name}</div>

            <button
                onClick={() => {
                    open(file.name);
                }}
            >
                {getSource(file.name) === Source.Polymart && (
                    <img src='/assets/plugininstaller/polymart.png' css={tw`h-8 w-8`}></img>
                )}
                {getSource(file.name) === Source.Spigot && (
                    <img src='/assets/plugininstaller/spigot.png' css={tw`h-8 w-8`}></img>
                )}
                {getSource(file.name) === Source.Modrinth && (
                    <img src='/assets/plugininstaller/modrinth.png' css={tw`h-8 w-8`}></img>
                )}
            </button>

            {file.isFile && <div css={tw`w-1/6 text-right mr-4 hidden sm:block`}>{bytesToString(file.size)}</div>}
            <div css={tw`w-1/5 text-right mr-4 hidden md:block`} title={file.modifiedAt.toString()}>
                {Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48
                    ? format(file.modifiedAt, 'MMM do, yyyy h:mma')
                    : formatDistanceToNow(file.modifiedAt, { addSuffix: true })}
            </div>
        </Clickable>
        <FileDropdownMenu file={file} />
    </div>
);

export default memo(FileObjectRow, (prevProps, nextProps) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { isArchiveType, isEditable, ...prevFile } = prevProps.file;
    const { isArchiveType: nextIsArchiveType, isEditable: nextIsEditable, ...nextFile } = nextProps.file;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    return isEqual(prevFile, nextFile);
});
