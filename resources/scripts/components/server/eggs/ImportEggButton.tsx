import React, { useState } from 'react';
import ImportEggModal from '@/components/server/eggs/ImportEggModal';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';

interface Props {
    onChange: () => void;
    onEggImported?: (eggId: number) => void;
}

export default ({ onChange, onEggImported }: Props) => {
    const [visible, setVisible] = useState(false);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);

    // Apenas administradores podem ver o botão de importação
    if (!rootAdmin) {
        return null;
    }

    return (
        <>
            {visible && (
                <ImportEggModal
                    onChange={() => onChange()}
                    onEggImported={onEggImported}
                    appear
                    visible
                    onDismissed={() => setVisible(false)}
                />
            )}
            <Button color={'grey'} css={tw`mt-3 mr-2`} onClick={() => setVisible(true)}>
                Importar Egg JSON
            </Button>
        </>
    );
};
