import React from 'react';
import { NavLink, Route, RouteComponentProps, Switch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import AvailableEggsContainer from '@/components/AvailableEggsContainer';

export default ({ location }: RouteComponentProps) => (
    <>
        <TransitionRouter>
            <Switch location={location}>
                <Route path={'/eggs'} exact>
                    <AvailableEggsContainer />
                </Route>
                <Route path={'*'}>
                    <NotFound />
                </Route>
            </Switch>
        </TransitionRouter>
    </>
);
