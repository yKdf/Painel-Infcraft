import React, { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Field from '@/components/elements/Field';
import tw, { styled } from 'twin.macro';
import Button from '@/components/elements/Button';
import Turnstile from 'react-cloudflare-turnstile';
import useFlash from '@/plugins/useFlash';

interface Values {
    username: string;
    password: string;
}

const LoginContainer = ({ history, location }: RouteComponentProps) => {
    const [token, setToken] = useState('');
    const [turnstileKey, setTurnstileKey] = useState(0);

    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);
    const googleEnabled = useStoreState((state) => state.settings.data!.google.enabled);
    const isCaptchaValid = !recaptchaEnabled || !!token;

    useEffect(() => {
        clearFlashes();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const checkpoint = params.get('sso_checkpoint');
        if (checkpoint) {
            history.replace('/auth/login/checkpoint', { token: checkpoint });
            return;
        }

        const error = params.get('sso_error');
        if (error) {
            addFlash({
                type: 'error',
                title: 'Erro',
                message: 'Não foi possível concluir o login com Google SSO. Tente novamente.',
            });
            history.replace('/auth/login');
        }
    }, [location.search]);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token) {
            setSubmitting(false);
            addFlash({ type: 'error', title: 'Erro', message: 'Valide o CAPTCHA antes de continuar.' });
            setTurnstileKey((prev) => prev + 1);
            return;
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                setToken('');
                setTurnstileKey((prev) => prev + 1);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    const onGoogleLoginClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (!isCaptchaValid) {
            event.preventDefault();
            clearFlashes();
            addFlash({ type: 'error', title: 'Erro', message: 'Valide o CAPTCHA antes de continuar com Google.' });
            setTurnstileKey((prev) => prev + 1);
        }
    };

    const ButtonLink = styled(Link)`
        ${tw`mt-4 rounded-xl bg-neutral-900 p-4 text-xs tracking-wide no-underline uppercase hover:text-neutral-300 hover:bg-neutral-800 transition-colors duration-200`};
        &:hover {
            ${tw`text-neutral-300 bg-neutral-800`};
        }
    `;

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required('Um nome de usuário ou e-mail deve ser fornecido.'),
                password: string().required('Por favor, digite a senha da sua conta.'),
            })}
        >
            {({ isSubmitting }) => (
                <LoginFormContainer title={'Bem-Vindo!'} css={tw`w-full flex`}>
                    <Field
                        light
                        type={'text'}
                        label={'Nome de usuário ou e-mail'}
                        name={'username'}
                        placeholder={'example@gmail.com'}
                        disabled={isSubmitting}
                    />

                    <div css={tw`mt-6`}>
                        <Field
                            light
                            type={'password'}
                            label={'Senha'}
                            name={'password'}
                            placeholder={'Senha'}
                            disabled={isSubmitting}
                        />
                    </div>

                    {recaptchaEnabled && (
                        <div css={tw`mt-6 flex justify-center`}>
                            <Turnstile
                                key={turnstileKey}
                                turnstileSiteKey={siteKey || '_invalid_key'}
                                callback={(token: string) => setToken(token)}
                                expiredCallback={() => setToken('')}
                                theme='dark'
                                execution={'render'}
                            />
                        </div>
                    )}

                    <div css={tw`mt-6`}>
                        <Button type={'submit'} size={'xlarge'} isLoading={isSubmitting} disabled={isSubmitting}>
                            Login
                        </Button>
                    </div>

                    {googleEnabled && (
                        <div css={tw`mt-4`}>
                            <a
                                href={
                                    isCaptchaValid
                                        ? `/auth/google${token ? `?recaptchaData=${encodeURIComponent(token)}` : ''}`
                                        : '#'
                                }
                                onClick={onGoogleLoginClick}
                                aria-disabled={!isCaptchaValid}
                                css={[
                                    tw`flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white p-3 text-sm font-medium text-neutral-700 no-underline transition-colors duration-200 hover:bg-neutral-100`,
                                    !isCaptchaValid && tw`cursor-not-allowed opacity-60 hover:bg-white`,
                                ]}
                            >
                                <svg width='18' height='18' viewBox='0 0 48 48' aria-hidden='true'>
                                    <path
                                        fill='#FFC107'
                                        d='M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
                                        c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
                                        c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z'
                                    />
                                    <path
                                        fill='#FF3D00'
                                        d='M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
                                        C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z'
                                    />
                                    <path
                                        fill='#4CAF50'
                                        d='M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.144,35.091,26.715,36,24,36
                                        c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z'
                                    />
                                    <path
                                        fill='#1976D2'
                                        d='M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
                                        c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z'
                                    />
                                </svg>
                                Continuar com Google
                            </a>
                        </div>
                    )}

                    <div css={tw`grid grid-cols-1 md:grid-cols-2 text-center gap-4`}>
                        <ButtonLink to='/auth/password'>Esqueceu sua senha?</ButtonLink>

                        <ButtonLink to='/auth/register'>Não tem uma conta?</ButtonLink>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
