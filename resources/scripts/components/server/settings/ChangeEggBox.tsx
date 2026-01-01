import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import { Actions, useStoreActions } from 'easy-peasy';
import renameServer from '@/api/server/renameServer';
import { object, string } from 'yup';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import useSWR from 'swr';
import Label from '@/components/elements/Label';
import Select from '@/components/elements/Select';
import ChangeEggButton from '../eggs/ChangeEggButton';
import getEggs from '@/api/server/eggs/getEggs';
import useFlash from '@/plugins/useFlash';
import ImportEggButton from '../eggs/ImportEggButton';

interface Values {
    name: string;
    description: string;
}
export interface EggsResponse {
    eggs: any[];
    currentEggId: number;
}

const ChangeEggBox = () => {
    const { isSubmitting } = useFormikContext<Values>();

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const { data, error, mutate } = useSWR<EggsResponse>([uuid, '/eggs'], (uuid) => getEggs(uuid), {
        revalidateOnFocus: false,
    });

    const [eggId, setEggId] = useState<number>(0);

    useEffect(() => {
        if (data && data.currentEggId) {
            setEggId(data.currentEggId);
        }
    }, [data]);

    useEffect(() => {
        if (!error) {
            clearFlashes('server:eggs');
        } else {
            clearAndAddHttpError({ key: 'server:eggs', error });
        }
    }, [error]);

    return (
        <TitledGreyBox title={'Trocar De Egg'} css={tw`relative mt-6`}>
            <SpinnerOverlay visible={isSubmitting} />
            <Form css={tw`mb-0`}>
                {data ? (
                    <div css={tw`w-full`}>
                        <Label>Selecionar Egg</Label>
                        <Select
                            css={tw`w-full mb-4`}
                            onChange={(e) => setEggId(parseInt(e.currentTarget.value))}
                            value={eggId}
                        >
                            {data.eggs.map((item, key) => (
                                <option key={key} value={item.id}>
                                    {item.name}
                                </option>
                            ))}
                        </Select>
                        <div css={tw`text-right`}>
                            <ImportEggButton
                                onChange={() => mutate()}
                                onEggImported={(importedEggId) => {
                                    setEggId(importedEggId);
                                }}
                            />
                            <ChangeEggButton
                                disabled={data.currentEggId === eggId}
                                eggId={eggId}
                                onChange={() => mutate()}
                            />
                        </div>
                    </div>
                ) : null}
            </Form>
        </TitledGreyBox>
    );
};

export default () => {
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const setServer = ServerContext.useStoreActions((actions) => actions.server.setServer);
    const { addError, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = ({ name, description }: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('settings');
        renameServer(server.uuid, name, description)
            .then(() => setServer({ ...server, name, description }))
            .catch((error) => {
                console.error(error);
                addError({ key: 'settings', message: httpErrorToHuman(error) });
            })
            .then(() => setSubmitting(false));
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                name: server.name || '',
                description: server.description || '',
            }}
            validationSchema={object().shape({
                name: string().required().min(1),
                description: string().nullable(),
            })}
        >
            <ChangeEggBox />
        </Formik>
    );
};
