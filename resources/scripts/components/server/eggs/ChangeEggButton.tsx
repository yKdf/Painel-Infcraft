import React, { useState } from 'react';
import ChangeEggModal from '@/components/server/eggs/ChangeEggModal';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';

interface Props {
    eggId: number;
    disabled: boolean;
    onChange: () => void;
}

export default ({ eggId, disabled, onChange }: Props) => {
    const [ visible, setVisible ] = useState(false);

    return (
        <>
            {visible && <ChangeEggModal eggId={eggId} onChange={() => onChange()} appear visible onDismissed={() => setVisible(false)} />}
            <Button color={disabled ? 'green' : 'primary'} disabled={disabled} css={tw`mt-3`} onClick={() => setVisible(true)}>Change Egg</Button>
        </>
    );
};
