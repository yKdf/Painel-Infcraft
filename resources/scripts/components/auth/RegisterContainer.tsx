import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import register from '@/api/auth/register';
import RegisterFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import tw, { styled } from 'twin.macro';
import Button from '@/components/elements/Button';
import Turnstile from 'react-cloudflare-turnstile';
import useFlash from '@/plugins/useFlash';
import { object, string } from 'yup';

interface Values {
    email: string;
    username: string;
    firstname: string;
    lastname: string;
    password: string;
    confirmPassword: string;
}

const RegisterContainer = () => {
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

        register({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    if (response.complete) {
                        // @ts-expect-error this is valid
                        window.location = response.intended || '/';
                        return;
                    }

                    setSubmitting(false);
                }
            })
            .catch((error) => {
                console.error(error);

                setToken('');
                setTurnstileKey((prev) => prev + 1);

                const data = JSON.parse(error.config.data);

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
                    error = 'O e-mail deve ser um endereço de e-mail válido.';

                setSubmitting(false);
                if (typeof error === 'string') {
                    addFlash({
                        type: 'error',
                        title: 'Error',
                        message: error || '',
                    });
                } else {
                    clearAndAddHttpError({ error });
                }
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
            initialValues={{
                email: '',
                username: '',
                firstname: '',
                lastname: '',
                password: '',
                confirmPassword: '',
            }}
            validationSchema={object().shape({
                email: string().required('Um e-mail deve ser fornecido.'),
                password: string().required('A senha deve ser fornecida.'),
                confirmPassword: string()
                    .required('A confirmação da senha deve ser fornecida.')
                    .test('password-match', 'As senhas devem corresponder.', function (value) {
                        const { password } = this.parent;
                        return password === value || !value;
                    }),
            })}
        >
            {({ isSubmitting }) => (
                <RegisterFormContainer title={'Inscreva-se'} css={tw`w-full flex`}>
                    <Field
                        light
                        type={'email'}
                        label={'Email'}
                        name={'email'}
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
                    <div css={tw`mt-6`}>
                        <Field
                            light
                            type={'password'}
                            label={'Confirmar Senha'}
                            name={'confirmPassword'}
                            placeholder={'Confirmar Senha'}
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
                            />
                        </div>
                    )}
                    <div css={tw`mt-6`}>
                        <Button type={'submit'} size={'xlarge'} isLoading={isSubmitting} disabled={isSubmitting}>
                            Cadastre-se
                        </Button>
                    </div>
                    <div css={tw`p-4 mt-2 text-center`}>
                        <ButtonLink to={'/auth/login'}>Já está cadastrado?</ButtonLink>
                    </div>
                </RegisterFormContainer>
            )}
        </Formik>
    );
};

export default RegisterContainer;
