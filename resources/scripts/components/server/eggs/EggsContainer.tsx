import React, { useEffect } from 'react';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import tw from 'twin.macro';
import useSWR from 'swr';
import useFlash from '@/plugins/useFlash';
import Spinner from '@/components/elements/Spinner';
import FlashMessageRender from '@/components/FlashMessageRender';
import getEggs from '@/api/server/eggs/getEggs';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import ChangeEggButton from '@/components/server/eggs/ChangeEggButton';

export interface EggsResponse {
    eggs: any[];
    currentEggId: number;
}

export default () => {
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);

    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const { data, error, mutate } = useSWR<EggsResponse>([ uuid, '/eggs' ], uuid => getEggs(uuid), {
        revalidateOnFocus: false,
    });

    useEffect(() => {
        if (!error) {
            clearFlashes('server:eggs');
        } else {
            clearAndAddHttpError({ key: 'server:eggs', error });
        }
    }, [ error ]);

    return (
        <ServerContentBlock title={'Donations'} css={tw`flex flex-wrap`}>
            <div css={tw`w-full`}>
                <FlashMessageRender byKey={'server:eggs'} css={tw`mb-4`} />
                {!data ?
                    <div css={tw`w-full`}>
                        <Spinner size={'large'} centered />
                    </div>
                    :
                    <>
                        {data.eggs.length < 1 ?
                            <p css={tw`text-center text-sm text-neutral-400 pt-4 pb-4`}>
                                There are no selectable egg.
                            </p>
                            :
                            (
                                <>
                                    <div css={tw`w-full flex flex-wrap`}>
                                        {data.eggs.map((item, key) => (
                                            <div css={tw`w-full md:w-4/12 md:pl-2 md:pr-2 pt-4`} key={key}>
                                                <TitledGreyBox title={item.name}>
                                                    <div css={tw`flex flex-wrap`}>
                                                        <div css={tw`w-auto p-0 m-0`}>
                                                            <img css={'width: 100%;'} src={item.thumbnail} />
                                                        </div>
                                                    </div>
                                                    <div css={tw`text-center`}>
                                                        <ChangeEggButton disabled={data.currentEggId === item.id} eggId={item.id} onChange={() => mutate()} />
                                                    </div>
                                                </TitledGreyBox>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )
                        }
                    </>
                }
            </div>
        </ServerContentBlock>
    );
};
