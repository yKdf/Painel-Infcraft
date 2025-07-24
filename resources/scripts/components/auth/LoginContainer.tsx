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
