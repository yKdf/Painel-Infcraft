import React, { useState } from 'react';
import ImportEggModal from '@/components/server/eggs/ImportEggModal';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';

interface Props {
    onChange: () => void;
}

export default ({ onChange }: Props) => {
    const [visible, setVisible] = useState(false);

    return (
        <>
            {visible && (
                <ImportEggModal onChange={() => onChange()} appear visible onDismissed={() => setVisible(false)} />
            )}
            <Button color={'grey'} css={tw`mt-3 mr-2`} onClick={() => setVisible(true)}>
                Importar Egg JSON
            </Button>
        </>
    );
};
