import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${breakpoint('sm')`
        ${tw`w-4/5 mx-auto`}
    `};

    ${breakpoint('md')`
        ${tw`w-3/4`}
    `};

    ${breakpoint('lg')`
        ${tw`w-3/5`}
    `};

    ${breakpoint('xl')`
        ${tw`w-full`}
        max-width: 500px;
    `};
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => {
    const icone = useStoreState((state: ApplicationStore) => state.settings.data!.icone);

    const isUrl = (value?: string) => typeof value === 'string' && /^(https?:\/\/|\/\/)/i.test(value.trim());

    return (
        <Container>
            <div css={tw`flex justify-center items-center pt-10`}>
                {isUrl(icone) ? (
                    <img src={icone} css={tw`w-64 md:w-80`} />
                ) : (
                    <span css={tw`text-6xl uppercase text-center text-neutral-100 font-medium`}>
                        {icone || 'Infcraft'}
                    </span>
                )}
            </div>

            {title && <h2 css={tw`text-3xl text-center text-neutral-100 font-normal py-4`}>{title}</h2>}
            <FlashMessageRender css={tw`mb-2 px-1`} />
            <Form {...props} ref={ref}>
                <div css={tw`w-full bg-black shadow-lg rounded-lg p-6`}>
                    <div css={tw`flex-1`}>{props.children}</div>
                </div>
            </Form>
            <p css={tw`text-center text-neutral-500 text-xs my-4`}>
                &copy; 2024 - {new Date().getFullYear()}&nbsp;
                <a
                    rel={'noopener nofollow noreferrer'}
                    href={'https://infcraft.net'}
                    target={'_blank'}
                    css={tw`no-underline text-neutral-500 hover:text-neutral-300`}
                >
                    Infcraft
                </a>
            </p>
        </Container>
    );
});
