import React from 'react';
import { ServerContext } from '@/state/server';
import ScreenBlock from '@/components/elements/ScreenBlock';
import { SvgsLinkalt } from '@/components/elements/SvgsLink';

export default () => {
    const status = ServerContext.useStoreState((state) => state.server.data?.status || null);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data?.isTransferring || false);
    const isNodeUnderMaintenance = ServerContext.useStoreState(
        (state) => state.server.data?.isNodeUnderMaintenance || false
    );

    return status === 'installing' || status === 'install_failed' || status === 'reinstall_failed' ? (
        <ScreenBlock
            title={'Executando o instalador'}
            image={SvgsLinkalt.ServerInstalling}
            message={'Seu servidor deverá estar pronto em breve. Tente novamente em alguns minutos.'}
        />
    ) : status === 'suspended' ? (
        <ScreenBlock
            title={'Servidor suspenso'}
            image={SvgsLinkalt.ServerError}
            message={'Este servidor está suspenso e não pode ser acessado.'}
        />
    ) : isNodeUnderMaintenance ? (
        <ScreenBlock
            title={'Nó em manutenção'}
            image={SvgsLinkalt.ServerError}
            message={'O nó deste servidor está atualmente em manutenção.'}
        />
    ) : (
        <ScreenBlock
            title={isTransferring ? 'Transferindo' : 'Restaurando do backup'}
            image={SvgsLinkalt.ServerRestore}
            message={
                isTransferring
                    ? 'Seu servidor está sendo transferido para um novo nó. Verifique novamente mais tarde.'
                    : 'Seu servidor está sendo restaurado a partir de um backup. Verifique novamente em alguns minutos.'
            }
        />
    );
};
