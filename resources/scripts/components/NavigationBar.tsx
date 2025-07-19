import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faLayerGroup, faSignOutAlt, faExchangeAlt, faSignal } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw, { css, theme } from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';
import ProgressBar from './elements/ProgressBar';
import { breakpoint } from '@/theme';

const RightNavigation = styled.div`
    & > a,
    & > button,
    & > .navigation-link {
        ${tw`flex items-center h-full no-underline text-neutral-300 px-6 cursor-pointer transition-all duration-150`};

        &:active,
        &:hover {
            ${tw`text-neutral-100 rounded-xl bg-black`};
        }

        &:active,
        &:hover,
        &.active {
            box-shadow: inset 0 -2px ${theme`colors.cyan.600`.toString()};
        }
    }
`;

const style = css`
    ${tw`w-full bg-neutral-800 rounded-xl mb-4 shadow-md overflow-x-auto`}
    max-width: 1200px;
    ${breakpoint('xl')`
    ${tw`mx-auto`}
  `}
`;

export default () => {
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <div css={style}>
            <ProgressBar />
            <SpinnerOverlay visible={isLoggingOut} />
            <div className={'mx-auto w-full flex items-center h-[3.5rem] max-w-[1200px]'}>
                <div id={'logo'} className={'flex-1'}>
                    <Link to={'/'}>
                        <img src={'/assets/svgs/Infcraft.svg'} css={tw`block h-[2.6rem]`} />
                        {/* {name} */}
                    </Link>
                </div>
                <RightNavigation className={'flex h-full items-center justify-center'}>
                    <SearchContainer />
                    <Tooltip placement={'bottom'} content={'Status'}>
                        <a href={'https://status.infcraft.net/'} rel={'noreferrer'} target={'_blank'}>
                            <FontAwesomeIcon icon={faSignal} />
                        </a>
                    </Tooltip>
                    <Tooltip placement={'bottom'} content={'Painel'}>
                        <NavLink to={'/'} exact>
                            <FontAwesomeIcon icon={faLayerGroup} />
                        </NavLink>
                    </Tooltip>
                    {rootAdmin && (
                        <>
                            <Tooltip placement={'bottom'} content={'Admin'}>
                                <a href={'/admin'} rel={'noreferrer'}>
                                    <FontAwesomeIcon icon={faCogs} />
                                </a>
                            </Tooltip>
                            <NavLink to={'/eggs'}>
                                <FontAwesomeIcon icon={faExchangeAlt} />
                            </NavLink>
                        </>
                    )}
                    <Tooltip placement={'bottom'} content={'Configuração de conta'}>
                        <NavLink to={'/account'}>
                            <span className={'flex items-center w-5 h-5'}>
                                <Avatar.User />
                            </span>
                        </NavLink>
                    </Tooltip>
                    <Tooltip placement={'bottom'} content={'Sair'}>
                        <button onClick={onTriggerLogout}>
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </Tooltip>
                </RightNavigation>
            </div>
        </div>
    );
};
