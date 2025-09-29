import React from 'react';

const link = 'https://cdn.infcraft.net/file/painel/utils/svgs/';

export const SvgsLink = {
    NotFound: () => <img src={link + 'not_found.svg'} alt='Not Found' />,
    ServerError: () => <img src={link + 'server_error.svg'} alt='Server Error' />,
    ServerInstalling: () => <img src={link + 'server_installing.svg'} alt='Server Installing' />,
    ServerRestore: () => <img src={link + 'server_restore.svg'} alt='Server Restore' />,
};

export const SvgsLinkalt = {
    NotFound: link + 'not_found.svg',
    ServerError: link + 'server_error.svg',
    ServerInstalling: link + 'server_installing.svg',
    ServerRestore: link + 'server_restore.svg',
};
