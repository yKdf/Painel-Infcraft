import React, { useState, useEffect } from 'react';
import { Actions, useStoreState, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import unlinkGoogleAccount from '@/api/account/unlinkGoogleAccount';
import FlashMessageRender from '@/components/FlashMessageRender';
import { useFlashKey } from '@/plugins/useFlash';

export default () => {
    const [loading, setLoading] = useState(false);
    const googleLinked = useStoreState((state: ApplicationStore) => state.user.data!.googleLinked);
    const updateUserData = useStoreActions((actions: Actions<ApplicationStore>) => actions.user.updateUserData);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('account:google');

    // Listen for messages from the OAuth popup window
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Verify the message is from our domain
            if (event.origin !== window.location.origin) {
                return;
            }

            if (event.data.type === 'google-auth-complete' && event.data.success) {
                clearFlashes();
                updateUserData({ googleLinked: true });
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [updateUserData, clearFlashes]);

    const handleLink = () => {
        const width = 500;
        const height = 600;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open(
            '/account/google/link',
            'GoogleLogin',
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
        );
    };

    const handleUnlink = () => {
        clearFlashes();
        setLoading(true);

        unlinkGoogleAccount()
            .then(() => {
                updateUserData({ googleLinked: false });
            })
            .catch((error) => {
                clearAndAddHttpError(error);
            })
            .finally(() => setLoading(false));
    };

    return (
        <>
            <FlashMessageRender byKey={'account:google'} css={tw`mb-4`} />
            {googleLinked ? (
                <div>
                    <p css={tw`text-sm mb-4`}>
                        Sua conta está vinculada ao Google. Você pode fazer login usando sua conta do Google.
                    </p>
                    <Button.Danger onClick={handleUnlink} disabled={loading}>
                        {loading ? 'Desvinculando...' : 'Desvincular Conta do Google'}
                    </Button.Danger>
                </div>
            ) : (
                <div>
                    <p css={tw`text-sm mb-4`}>Vincule sua conta do Google para fazer login mais rapidamente.</p>
                    <Button onClick={handleLink}>Vincular Conta do Google</Button>
                </div>
            )}
        </>
    );
};
