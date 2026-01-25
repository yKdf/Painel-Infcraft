import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import Select from '../elements/Select';
import getServerResourceUsage, { ServerPowerState } from '@/api/server/getServerResourceUsage';

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);
    const [statusFilter, setStatusFilter] = usePersistedState<ServerPowerState>('status-filter', 'all');
    const [serverStates, setServerStates] = useState<Record<string, ServerPowerState | 'error'>>({});

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    useEffect(() => {
        if (!servers?.items.length) return;

        // Reset states when page changes or servers reload
        setServerStates({});

        servers.items.forEach((server) => {
            // If the server status is not null (e.g. installing, suspended), we don't strictly need to fetch resources
            // but for 'online'/'offline' check we usually do. However, suspended servers are handled by server.status.
            // Only fetch for servers that look "ready" (status === null) to avoid errors or redundant calls
            if (server.status === null) {
                getServerResourceUsage(server.uuid)
                    .then((stats) => {
                        setServerStates((prev) => ({ ...prev, [server.uuid]: stats.status }));
                    })
                    .catch(() => {
                        setServerStates((prev) => ({ ...prev, [server.uuid]: 'error' }));
                    });
            }
        });
    }, [servers?.items, page, showOnlyAdmin]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    const filterItems = (servers?.items || []).filter((server) => {
        if (statusFilter === 'all') return true;

        if (statusFilter === 'suspended') return server.status === 'suspended';

        const currentPowerState = serverStates[server.uuid];

        if (statusFilter === 'running') {
            return currentPowerState === 'running';
        }

        if (statusFilter === 'offline') {
            return currentPowerState === 'offline';
        }

        return true;
    });

    return (
        <PageContentBlock title={'Painel'} showFlashKey={'dashboard'}>
            <div css={tw`mb-2 flex justify-end space-x-4 items-center`}>
                {rootAdmin && (
                    <div css={tw`flex items-center`}>
                        <p css={tw`uppercase text-xs text-neutral-400 mr-2`}>
                            {showOnlyAdmin ? 'Mostrando servidores de outras pessoas' : 'Mostrando seus servidores'}
                        </p>
                        <Switch
                            name={'show_all_servers'}
                            defaultChecked={showOnlyAdmin}
                            onChange={() => setShowOnlyAdmin((s) => !s)}
                        />
                    </div>
                )}
                <div css={tw`flex items-center`}>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as ServerPowerState)}
                        css={tw`px-2 py-1 pr-8`}
                    >
                        <option value='all'>Todos</option>
                        <option value='running'>Online</option>
                        <option value='offline'>Offline</option>
                        <option value='suspended'>Suspensos</option>
                    </Select>
                </div>
            </div>
            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={{ ...servers, items: filterItems }} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            items.map((server, index) => (
                                <ServerRow key={server.uuid} server={server} css={index > 0 ? tw`mt-2` : undefined} />
                            ))
                        ) : (
                            <p css={tw`text-center text-sm text-neutral-400`}>
                                {showOnlyAdmin
                                    ? 'There are no other servers to display.'
                                    : 'There are no servers associated with your account.'}
                            </p>
                        )
                    }
                </Pagination>
            )}
        </PageContentBlock>
    );
};
