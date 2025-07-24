import * as React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import requestPasswordResetEmail from '@/api/auth/requestPasswordResetEmail';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import Field from '@/components/elements/Field';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import tw, { styled } from 'twin.macro';
import Button from '@/components/elements/Button';
import Turnstile from 'react-cloudflare-turnstile';
import useFlash from '@/plugins/useFlash';

interface Values {
    email: string;
}

export default () => {
    const [token, setToken] = useState('');
    const [turnstileKey, setTurnstileKey] = useState(0);

    const { clearFlashes, addFlash } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const handleSubmission = ({ email }: Values, { setSubmitting, resetForm }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token) {
            setSubmitting(false);
            addFlash({ type: 'error', title: 'Erro', message: 'Valide o CAPTCHA antes de continuar.' });
            setTurnstileKey((prev) => prev + 1);
            return;
        }

        requestPasswordResetEmail(email, token)
            .then((response) => {
                resetForm();
                addFlash({ type: 'success', title: 'Sucesso', message: response });
            })
            .catch((error) => {
                console.error(error);
                addFlash({ type: 'error', title: 'Error', message: httpErrorToHuman(error) });
            })
            .then(() => {
                setToken('');
                setTurnstileKey((prev) => prev + 1);

                setSubmitting(false);
            });
    };

    const ButtonLink = styled(Link)`
        ${tw`rounded-xl bg-neutral-900 p-4 text-xs tracking-wide no-underline uppercase hover:text-neutral-300 hover:bg-neutral-800 transition-colors duration-200`};
        &:hover {
            ${tw`text-neutral-300 bg-neutral-800`};
        }
    `;

    return (
        <Formik
            onSubmit={handleSubmission}
            initialValues={{ email: '' }}
            validationSchema={object().shape({
                email: string()
                    .email('Um endereço de e-mail válido deve ser fornecido para continuar.')
                    .required('Um endereço de e-mail válido deve ser fornecido para continuar.'),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer title={'Solicitar redefinição de senha'} css={tw`w-full flex`}>
                    <Field
                        light
                        label={'Email'}
                        description={
                            'Digite o endereço de e-mail da sua conta para receber instruções sobre como redefinir sua senha.'
                        }
                        name={'email'}
                        type={'email'}
                    />
                    {recaptchaEnabled && (
                        <div css={tw`mt-6 flex justify-center`}>
                            <Turnstile
                                key={turnstileKey}
                                turnstileSiteKey={siteKey || '_invalid_key'}
                                callback={(token: string) => setToken(token)}
                                expiredCallback={() => setToken('')}
                                theme='dark'
                            />
                        </div>
                    )}
                    <div css={tw`mt-6`}>
                        <Button type={'submit'} size={'xlarge'} disabled={isSubmitting} isLoading={isSubmitting}>
                            Enviar Email
                        </Button>
                    </div>
                    <div css={tw`p-4 mt-2 text-center`}>
                        <ButtonLink to={'/auth/login'}>Voltar para Login</ButtonLink>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};
