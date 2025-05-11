import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import reinstallServer from '@/api/server/reinstallServer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'Seu servidor iniciou o processo de reinstalação.',
                });
            })
            .catch((error) => {
                console.error(error);

                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => setModalVisible(false));
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <TitledGreyBox title={'Reinstale o servidor'} css={tw`relative`}>
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirme a reinstalação do servidor'}
                confirm={'Sim, reinstale o servidor'}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
            >
                Seu servidor será parado e alguns arquivos poderão ser deletados ou modificados durante esse processo,
                tem certeza você deseja continuar?
            </Dialog.Confirm>
            <p css={tw`text-sm`}>
                A reinstalação do servidor irá interrompê-lo e, em seguida, executar novamente o script de instalação
                que o configurou inicialmente acima.&nbsp;
                <strong css={tw`font-medium`}>
                    Alguns arquivos podem ser excluídos ou modificados durante este processo. Faça backup de seus dados
                    antes antes continuando.
                </strong>
            </p>
            <div css={tw`mt-6 text-right`}>
                <Button.Danger variant={Button.Variants.Secondary} onClick={() => setModalVisible(true)}>
                    Reinstale o servidor
                </Button.Danger>
            </div>
        </TitledGreyBox>
    );
};
