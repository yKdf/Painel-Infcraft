import React, { lazy } from 'react';
import ServerConsole from '@/components/server/console/ServerConsoleContainer';
import DatabasesContainer from '@/components/server/databases/DatabasesContainer';
import ScheduleContainer from '@/components/server/schedules/ScheduleContainer';
import UsersContainer from '@/components/server/users/UsersContainer';
import BackupContainer from '@/components/server/backups/BackupContainer';
import NetworkContainer from '@/components/server/network/NetworkContainer';
import StartupContainer from '@/components/server/startup/StartupContainer';
import FileManagerContainer from '@/components/server/files/FileManagerContainer';
import SettingsContainer from '@/components/server/settings/SettingsContainer';
import AccountOverviewContainer from '@/components/dashboard/AccountOverviewContainer';
import AccountApiContainer from '@/components/dashboard/AccountApiContainer';
import AccountSSHContainer from '@/components/dashboard/ssh/AccountSSHContainer';
import ActivityLogContainer from '@/components/dashboard/activity/ActivityLogContainer';
import ServerActivityLogContainer from '@/components/server/ServerActivityLogContainer';
import PluginManagerContainer from '@/components/server/plugin/PluginManagerContainer';
import EggsContainer from '@/components/server/eggs/EggsContainer';

// Each of the router files is already code split out appropriately — so
// all of the items above will only be loaded in when that router is loaded.
//
// These specific lazy loaded routes are to avoid loading in heavy screens
// for the server dashboard when they're only needed for specific instances.
const FileEditContainer = lazy(() => import('@/components/server/files/FileEditContainer'));
const ScheduleEditContainer = lazy(() => import('@/components/server/schedules/ScheduleEditContainer'));

interface RouteDefinition {
    path: string;
    // If undefined is passed this route is still rendered into the router itself
    // but no navigation link is displayed in the sub-navigation menu.
    name: string | undefined;
    component: React.ComponentType;
    exact?: boolean;
}

interface ServerRouteDefinition extends RouteDefinition {
    permission: string | string[] | null;
    nestId?: number;
    eggId?: number;
    nestIds?: number[];
    eggIds?: number[];
}

interface Routes {
    // All of the routes available under "/account"
    account: RouteDefinition[];
    // All of the routes available under "/server/:id"
    server: ServerRouteDefinition[];
}

export default {
    account: [
        {
            path: '/',
            name: 'Conta',
            component: AccountOverviewContainer,
            exact: true,
        },
        {
            path: '/api',
            name: 'Credenciais de API',
            component: AccountApiContainer,
        },
        {
            path: '/ssh',
            name: 'Chaves SSH',
            component: AccountSSHContainer,
        },
        {
            path: '/activity',
            name: 'Atividades',
            component: ActivityLogContainer,
        },
    ],
    server: [
        {
            path: '/',
            permission: null,
            name: 'Console',
            component: ServerConsole,
            exact: true,
        },
        {
            path: '/files',
            permission: 'file.*',
            name: 'Files',
            component: FileManagerContainer,
        },
        {
            path: '/files/:action(edit|new)',
            permission: 'file.*',
            name: undefined,
            component: FileEditContainer,
        },
        {
            path: '/databases',
            permission: 'database.*',
            name: 'Databases',
            component: DatabasesContainer,
        },
        {
            path: '/schedules',
            permission: 'schedule.*',
            name: 'Schedules',
            component: ScheduleContainer,
        },
        {
            path: '/schedules/:id',
            permission: 'schedule.*',
            name: undefined,
            component: ScheduleEditContainer,
        },
        {
            path: '/users',
            permission: 'user.*',
            name: 'Users',
            component: UsersContainer,
        },
        {
            path: '/backups',
            permission: 'backup.*',
            name: 'Backups',
            component: BackupContainer,
        },
        {
            path: '/network',
            permission: 'allocation.*',
            name: 'Network',
            component: NetworkContainer,
        },
        {
            path: '/plugins',
            permission: 'file.*',
            nestId: 1,
            name: 'Plugins',
            component: PluginManagerContainer,
        },
        {
            path: '/startup',
            permission: 'startup.*',
            name: 'Startup',
            component: StartupContainer,
        },
        {
            path: '/settings',
            permission: ['settings.*', 'file.sftp'],
            name: 'Settings',
            component: SettingsContainer,
        },
        {
            path: '/eggs',
            permission: ['eggchanger.*'],
            name: 'Egg Changer',
            component: EggsContainer,
        },
        {
            path: '/activity',
            permission: 'activity.*',
            name: 'Activity',
            component: ServerActivityLogContainer,
        },
    ],
} as Routes;
