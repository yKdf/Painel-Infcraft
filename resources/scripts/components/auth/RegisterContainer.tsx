import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import register from '@/api/auth/register';
import RegisterFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
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
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

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
            ref.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });

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
                if (ref.current) ref.current.reset();

                const data = JSON.parse(error.config.data);

                if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*[a-zA-Z0-9]$/.test(data.username))
                    error =
                        'O nome de usuário deve começar e terminar com caracteres alfanuméricos e conter apenas letras, números, travessões, sublinhados e pontos.';
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
                username: string().required('Um nome de usuário deve ser fornecido.'),
                firstname: string().optional(),
                lastname: string().optional(),
                password: string().required('A senha deve ser fornecida.'),
                confirmPassword: string()
                    .required('A confirmação da senha deve ser fornecida.')
                    .test('password-match', 'As senhas devem corresponder.', function (value) {
                        const { password } = this.parent;
                        return password === value || !value;
                    })
                    .required('A confirmação da senha deve ser fornecida.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
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
                            type={'text'}
                            label={'Nome de usuário'}
                            name={'username'}
                            placeholder={'Nome de usuário'}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div css={tw`mt-6`}>
                        <Field
                            light
                            type={'text'}
                            label={'Primeiro nome (Opcional)'}
                            name={'firstname'}
                            placeholder={'Primeiro nome'}
                            disabled={isSubmitting}
                        />
                    </div>
                    {/*
                    <div css={tw`mt-6`}>
                        <Field
                            light
                            type={'text'}
                            label={'Sobrenome'}
                            name={'lastname'}
                            placeholder={'Sobrenome'}
                            disabled={isSubmitting}
                        />
                    </div>
                    */}
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
                    <div css={tw`mt-6`}>
                        <Button type={'submit'} size={'xlarge'} isLoading={isSubmitting} disabled={isSubmitting}>
                            Cadastre-se
                        </Button>
                    </div>

                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )}
                    <div css={tw`mt-6 text-center`}>
                        <Link
                            to={'/auth/login'}
                            css={tw`text-xs text-neutral-500 tracking-wide no-underline uppercase hover:text-neutral-600 hover:underline`}
                        >
                            Já está cadastrado?
                        </Link>
                    </div>
                </RegisterFormContainer>
            )}
        </Formik>
    );
};

export default RegisterContainer;
