import React, { useEffect } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useSWR from 'swr';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import getEggs from '@/api/getEggs';

export interface EggsResponse {
    eggs: any[];
}

export default () => {
    const { data, error } = useSWR<EggsResponse>([ '/eggs' ], () => getEggs());

    const { clearFlashes, clearAndAddHttpError } = useFlash();

    useEffect(() => {
        if (!error) {
            clearFlashes('eggs');
        } else {
            clearAndAddHttpError({ key: 'eggs', error });
        }
    }, [ error ]);

    return (
        <PageContentBlock title={'Available Eggs'} showFlashKey={'eggs'}>
            {!data ?
                <div css={tw`w-full`}>
                    <Spinner size={'large'} centered />
                </div>
                :
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
                                </TitledGreyBox>
                            </div>
                        ))}
                    </div>
                </>
            }
        </PageContentBlock>
    );
};
