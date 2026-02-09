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

const LoginContainer = ({ history }: RouteComponentProps) => {
    const [token, setToken] = useState('');
    const [turnstileKey, setTurnstileKey] = useState(0);

    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

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
                console.log(response);
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
            })
            .catch((error) => {
                console.error(error);

                setToken('');
                setTurnstileKey((prev) => prev + 1);

                setSubmitting(false);
                clearAndAddHttpError({ error });
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

                    {useStoreState((state) => state.settings.data!.google.enabled) && (
                        <div css={tw`mt-4 font-semibold`}>
                            <button
                                type={'button'}
                                onClick={() => {
                                    const width = 500;
                                    const height = 600;
                                    const left = (window.screen.width - width) / 2;
                                    const top = (window.screen.height - height) / 2;
                                    window.open(
                                        '/auth/google',
                                        'GoogleLogin',
                                        `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
                                    );
                                }}
                                css={tw`w-full flex items-center justify-center rounded-lg bg-white p-3 text-neutral-800 hover:bg-neutral-200 transition-colors duration-200 shadow-sm border border-neutral-300 cursor-pointer`}
                            >
                                <svg className='w-5 h-5 mr-3' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                                    <title>Google</title>
                                    <g transform='matrix(1, 0, 0, 1, 0, 0)'>
                                        <path
                                            d='M23.52,12.216c0,-0.81 -0.063,-1.719 -0.234,-2.538l-11.286,0l0,4.608l6.633,0c-0.315,1.521 -1.134,2.772 -2.313,3.618l0,2.88l3.654,0c2.196,-2.025 3.51,-5.067 3.51,-8.568Z'
                                            fill='#4285F4'
                                        ></path>
                                        <path
                                            d='M12,24c3.159,0 5.922,-1.053 7.956,-2.916l-3.654,-2.88c-0.963,0.666 -2.25,1.08 -3.996,1.08c-3.15,0 -5.877,-2.142 -6.858,-5.067l-3.798,0l0,2.943c1.944,3.879 5.958,6.84 10.35,6.84Z'
                                            fill='#34A853'
                                        ></path>
                                        <path
                                            d='M5.142,16.216c-0.495,-1.431 -0.495,-3.006 0,-4.437l0,-2.943l-3.798,0c-2.043,4.014 -2.043,8.748 0,12.762l3.798,-2.943Z'
                                            fill='#FBBC05'
                                        ></path>
                                        <path
                                            d='M12,4.734c1.782,-0.027 3.501,0.657 4.779,1.881l3.528,-3.537c-2.322,-2.196 -5.463,-3.357 -8.667,-3.078c-4.392,0 -8.406,2.961 -10.35,6.84l3.798,2.943c0.981,-2.925 3.708,-5.067 6.858,-5.067Z'
                                            fill='#EA4335'
                                        ></path>
                                    </g>
                                </svg>
                                <span css={tw`uppercase`}>Entrar com Google</span>
                            </button>
                        </div>
                    )}

                    <div css={tw`p-4 mt-2 text-center`}>
                        <ButtonLink to={'/auth/password'}>Esqueceu sua senha?</ButtonLink>
                    </div>
                    <div css={tw`p-4 text-center space-x-2`}>
                        <ButtonLink to={'/auth/register'}>Não tem uma conta?</ButtonLink>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
