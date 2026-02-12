import * as React from 'react';
import ContentBox from '@/components/elements/ContentBox';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import GoogleAccountLinkForm from '@/components/dashboard/forms/GoogleAccountLinkForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import tw from 'twin.macro';
import { breakpoint } from '@/theme';
import styled from 'styled-components/macro';
import MessageBox from '@/components/MessageBox';
import { useLocation } from 'react-router-dom';

const Container = styled.div`
    ${tw`flex flex-wrap`};

    & > div {
        ${tw`w-full`};

        ${breakpoint('sm')`
      width: calc(50% - 1rem);
    `}

        ${breakpoint('md')`
      ${tw`w-auto flex-1`};
    `}
    }
`;

export default () => {
    const { state, search } = useLocation<undefined | { twoFactorRedirect?: boolean }>();
    const params = new URLSearchParams(search);
    const ssoLinked = params.get('sso_linked') === '1';
    const hasSsoError = params.has('sso_error');

    return (
        <PageContentBlock title={'Visão geral da conta'}>
            {state?.twoFactorRedirect && (
                <MessageBox title={'2-Factor Required'} type={'error'}>
                    Sua conta deve ter a autenticação de dois fatores habilitada para continuar.
                </MessageBox>
            )}
            {ssoLinked && (
                <MessageBox title={'Google vinculado'} type={'success'}>
                    Sua conta Google foi vinculada com sucesso.
                </MessageBox>
            )}
            {hasSsoError && (
                <MessageBox title={'Erro no Google SSO'} type={'error'}>
                    Não foi possível concluir a operação com Google SSO. Tente novamente.
                </MessageBox>
            )}

            <Container
                css={[
                    tw`lg:grid lg:grid-cols-3 mb-10`,
                    state?.twoFactorRedirect || ssoLinked || hasSsoError ? tw`mt-4` : tw`mt-10`,
                ]}
            >
                <ContentBox title={'Atualizar senha'} showFlashes={'account:password'}>
                    <UpdatePasswordForm />
                </ContentBox>
                <ContentBox
                    css={tw`mt-8 sm:mt-0 sm:ml-8`}
                    title={'Atualizar endereço de e-mail'}
                    showFlashes={'account:email'}
                >
                    <UpdateEmailAddressForm />
                </ContentBox>
                <div>
                    <ContentBox css={tw`md:ml-8 mt-8 md:mt-0`} title={'Verificação em duas etapas'}>
                        <ConfigureTwoFactorForm />
                    </ContentBox>
                    <ContentBox css={tw`md:ml-8 mt-8 md:mt-4`} title={'Google SSO'} showFlashes={'account:google'}>
                        <GoogleAccountLinkForm />
                    </ContentBox>
                </div>
            </Container>
        </PageContentBlock>
    );
};
