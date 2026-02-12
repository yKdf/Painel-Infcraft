import React from 'react';
import { Actions, State, useStoreActions, useStoreState } from 'easy-peasy';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { ApplicationStore } from '@/state';
import getGoogleLinkUrl from '@/api/account/getGoogleLinkUrl';
import unlinkGoogleAccount from '@/api/account/unlinkGoogleAccount';
import { httpErrorToHuman } from '@/api/http';
import Field from '@/components/elements/Field';
import { Form, Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';

interface Values {
    currentPassword: string;
}

const schema = Yup.object().shape({
    currentPassword: Yup.string().required('Você deve confirmar sua senha atual.'),
});

export default () => {
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const googleEnabled = useStoreState(
        (state: State<ApplicationStore>) => state.settings.data?.google.enabled ?? false
    );
    const updateUserData = useStoreActions((state: Actions<ApplicationStore>) => state.user.updateUserData);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const onLink = (currentPassword: string) => {
        clearFlashes('account:google');

        return getGoogleLinkUrl(currentPassword)
            .then(({ url, enabled }) => {
                if (!enabled || !url) {
                    addFlash({
                        key: 'account:google',
                        type: 'error',
                        title: 'Erro',
                        message: 'Google SSO não está disponível no momento.',
                    });

                    return;
                }

                window.location.href = url;
            })
            .catch((error) => {
                addFlash({
                    key: 'account:google',
                    type: 'error',
                    title: 'Erro',
                    message: httpErrorToHuman(error),
                });
            });
    };

    const onUnlink = (currentPassword: string) => {
        clearFlashes('account:google');

        return unlinkGoogleAccount(currentPassword)
            .then(() => {
                updateUserData({ googleLinked: false, googleEmail: null });
                addFlash({
                    key: 'account:google',
                    type: 'success',
                    message: 'Conta Google desvinculada com sucesso.',
                });
            })
            .catch((error) => {
                addFlash({
                    key: 'account:google',
                    type: 'error',
                    title: 'Erro',
                    message: httpErrorToHuman(error),
                });
            });
    };

    if (!googleEnabled) {
        return <p css={tw`text-sm text-neutral-500`}>Google SSO está desativado pelo administrador.</p>;
    }

    return (
        <Formik<Values>
            initialValues={{ currentPassword: '' }}
            validationSchema={schema}
            onSubmit={async (values, { setSubmitting }: FormikHelpers<Values>) => {
                const action = user?.googleLinked ? onUnlink : onLink;
                setSubmitting(true);
                await action(values.currentPassword);
                setSubmitting(false);
            }}
        >
            {({ isSubmitting, isValid }) => (
                <Form css={tw`space-y-4`}>
                    {user?.googleLinked ? (
                        <p css={tw`text-sm text-neutral-300`}>
                            Conta vinculada: <span css={tw`font-semibold`}>{user.googleEmail || 'Google'}</span>
                        </p>
                    ) : (
                        <p css={tw`text-sm text-neutral-400`}>
                            Vincule sua conta Google para entrar sem senha nesta conta.
                        </p>
                    )}

                    <Field
                        id={'google_current_password'}
                        type={'password'}
                        name={'currentPassword'}
                        label={'Confirme sua senha'}
                    />

                    {user?.googleLinked ? (
                        <Button.Danger type={'submit'} disabled={isSubmitting || !isValid}>
                            Desvincular Google
                        </Button.Danger>
                    ) : (
                        <Button type={'submit'} disabled={isSubmitting || !isValid}>
                            Vincular com Google
                        </Button>
                    )}
                </Form>
            )}
        </Formik>
    );
};
