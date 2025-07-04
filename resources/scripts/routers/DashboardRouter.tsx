import React from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import EggsRouter from './EggsRouter';

export default () => {
    const location = useLocation();

    return (
        <>
            <div className={`flex flex-col items-center justify-center`}>
                <NavigationBar />
            </div>
            {location.pathname.startsWith('/account') && (
                <div className={`flex flex-col items-center justify-center`}>
                    <SubNavigation>
                        <div>
                            {routes.account
                                .filter((route) => !!route.name)
                                .map(({ path, name, exact = false }) => (
                                    <NavLink key={path} to={`/account/${path}`.replace('//', '/')} exact={exact}>
                                        {name}
                                    </NavLink>
                                ))}
                        </div>
                    </SubNavigation>
                </div>
            )}
            <TransitionRouter>
                <React.Suspense fallback={<Spinner centered />}>
                    <Switch location={location}>
                        <Route path={'/'} exact>
                            <DashboardContainer />
                        </Route>
                        {routes.account.map(({ path, component: Component }) => (
                            <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                <Component />
                            </Route>
                        ))}
                        <Route path='/eggs' component={EggsRouter} />
                        <Route path={'*'}>
                            <NotFound />
                        </Route>
                    </Switch>
                </React.Suspense>
            </TransitionRouter>
        </>
    );
};
