import React, { useEffect, useState } from 'react';
import Modal from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import { number, object, string } from 'yup';
import { ServerContext } from '@/state/server';
import { httpErrorToHuman } from '@/api/http';
import Button from '@/components/elements/Button';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import getSplittedServer from '@/api/server/splitted/getSplittedServer';
import { SocketEvent, SocketRequest } from '../events';
import { bytesToMegabytes } from '@/helpers';
import { useStoreActions } from '@/state/hooks';
import { Actions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import splitserver from '@/api/server/splitted/splitserver';
import Can from '@/components/elements/Can';
import FormikSwitch from '@/components/elements/FormikSwitch';

interface Values {
    ram: string;
    swap: string;
    disk: string;
    cpu: string;
    name: string;
    addsubusers: boolean;
}

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [visible, setVisible] = useState(false);
    //const egg = ServerContext.useStoreState((state) => state.server.data!.eggName);
    const [stats, setStats] = useState(0);

    const { data, error, isValidating } = getSplittedServer(uuid);

    if (!data || (error && isValidating)) {
        return <Spinner size={'large'} centered />;
    }
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const statsListener = (data: string) => {
        let stats: any = {};
        try {
            stats = JSON.parse(data);
        } catch (e) {
            return;
        }
        setStats(stats.disk_bytes);
    };

    useEffect(() => {
        if (!connected || !instance) {
            return;
        }
        instance.addListener(SocketEvent.STATS, statsListener);
        instance.send(SocketRequest.SEND_STATS);

        return () => {
            instance.removeListener(SocketEvent.STATS, statsListener);
        };
    }, [instance, connected]);
    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('splitted');
        setSubmitting(true);
        splitserver(
            uuid,
            Number(values.cpu),
            Number(values.ram),
            Number(values.disk),
            Number(values.swap),
            values.name,
            values.addsubusers
        )
            .then(() => {
                addFlash({
                    type: 'success',
                    title: 'Sucesso',
                    message: 'Servidor dividido com sucesso',
                    key: 'splitted',
                });
                setSubmitting(false);
                setVisible(false);
            })
            .catch((error) => {
                addFlash({ type: 'error', title: 'Erro', message: httpErrorToHuman(error), key: 'splitted' });
                setSubmitting(false);
                setVisible(false);
            });
    };
    const cpuVari = data?.total?.cpu === 0 ? null : data.total.cpu - 1;
    const cpuDisponivel = cpuVari !== null ? cpuVari - 100 : 1000000;
    const cpuMinimo = cpuVari !== null ? 1 : 0;

    const schema = object().shape({
        ram: number()
            .required('Um carneiro deve ser fornecido.')
            .min(512, 'Você não pode ter menos de 512 MB de RAM')
            .max(data.total.memory - 512, 'Não há RAM suficiente disponível'),
        swap: number()
            .required('Uma troca deve ser fornecida.')
            .min(0, 'Você não pode ter menos de 512 MB de swap')
            .max(data.total.swap, 'Não há swap suficiente disponível'),
        disk: number()
            .required('Um disco deve ser fornecido.')
            .min(1024, 'Você não pode ter menos de 1G de disco')
            .max(data.total.disk - bytesToMegabytes(stats), 'Não há disco suficiente disponível'),
        cpu: number()
            .required('Uma CPU deve ser fornecida.')
            .min(cpuMinimo, 'Você não pode ter menos de 1% de CPU')
            .max(cpuDisponivel, 'Não há CPU suficiente disponível'),
        name: string().required('Um nome deve ser fornecido.'),
    });
    return (
        <>
            <Formik
                onSubmit={submit}
                initialValues={{
                    ram: '',
                    swap: data.total.swap < 1 ? '0' : '',
                    disk: '',
                    cpu: '',
                    name: '',
                    addsubusers: false,
                }}
                validationSchema={schema}
            >
                {({ isSubmitting, resetForm }) => (
                    <Modal
                        visible={visible}
                        dismissable={!isSubmitting}
                        showSpinnerOverlay={isSubmitting}
                        onDismissed={() => {
                            resetForm();
                            setVisible(false);
                        }}
                    >
                        <h2 css={tw`text-2xl mb-6`}>Divida o servidor</h2>

                        <Form css={tw`m-0`}>
                            <div css={tw`flex mx-auto`}>
                                <Field
                                    type={'number'}
                                    id={'cpu'}
                                    name={'cpu'}
                                    label={'CPU do servidor'}
                                    description={'CPU do novo servidor (100% = 1 core).'}
                                    splittedavailable={`${
                                        cpuVari === null ? 'Ilimitado' : cpuDisponivel + '%'
                                    } disponível.`}
                                    cssstyle={tw`w-3/6`}
                                    //disabled={data.total.cpu - 1 < 1}
                                    placeholder={'0'}
                                />
                                <Field // new fileds type for size
                                    type={'number'}
                                    id={'ram'}
                                    name={'ram'}
                                    label={'Ram do servidor'}
                                    description={'Ram do novo servidor (em mb).'}
                                    splittedavailable={`${
                                        data.total.memory - 512 > 0 ? data.total.memory - 512 + 'mb' : 'Sem ram'
                                    } disponível.`}
                                    cssstyle={tw`w-3/6 ml-4`}
                                    disabled={data.total.memory - 512 < 1}
                                    placeholder={'0'}
                                />
                            </div>
                            <div css={tw`flex mx-auto mt-2`}>
                                <Field
                                    type={'number'}
                                    id={'disk'}
                                    name={'disk'}
                                    label={'Disco do servidor'}
                                    description={'Disco do novo servidor (em mb).'}
                                    splittedavailable={`${
                                        data.total.disk - bytesToMegabytes(stats) > 0
                                            ? data.total.disk - bytesToMegabytes(stats) + 'mb'
                                            : 'Sem disk'
                                    } disponível.`}
                                    cssstyle={tw`w-3/6`}
                                    disabled={data.total.disk - bytesToMegabytes(stats) < 1}
                                    placeholder={'0'}
                                />
                                <Field
                                    type={'number'}
                                    id={'swap'}
                                    name={'swap'}
                                    label={'Troca de servidor'}
                                    description={'Troca do novo servidor (em mb).'}
                                    splittedavailable={`${
                                        data.total.swap > 0 ? data.total.swap + 'mb' : 'Sem swap'
                                    } disponível.`}
                                    cssstyle={tw`w-3/6 ml-4`}
                                    disabled={data.total.swap < 1}
                                    placeholder={'0'}
                                />
                            </div>
                            <div css={tw`mt-6 mb-6`}>
                                <Field
                                    type={'string'}
                                    id={'name'}
                                    name={'name'}
                                    label={'Nome do servidor'}
                                    description={'Nome do novo servidor'}
                                    placeholder={`Nome`}
                                />
                            </div>
                            <Can action={'user.create'}>
                                <div css={tw`mt-6 bg-neutral-700 border border-neutral-800 shadow-inner p-4 rounded`}>
                                    <FormikSwitch
                                        name={'addsubusers'}
                                        label={'Subusuário'}
                                        description={
                                            'Adicione subusuário(s) ao novo servidor. Você pode adicionar subusuários depois.'
                                        }
                                    />
                                </div>
                            </Can>
                            <div css={tw`mt-6`}>
                                {cpuDisponivel - 1 < 1 && (
                                    <p css={tw`text-red-500 text-xs`}>
                                        -Você precisa de mais CPU para dividir este servidor
                                    </p>
                                )}
                                {data.total.memory - 512 < 1 && (
                                    <p css={tw`text-red-500 text-xs`}>
                                        -Você precisa de mais RAM para dividir este servidor
                                    </p>
                                )}
                                {data.total.disk - 512 < 1 && (
                                    <p css={tw`text-red-500 text-xs`}>
                                        -Você precisa de mais DISCO para dividir este servidor
                                    </p>
                                )}
                            </div>
                            <div css={tw`flex flex-wrap justify-end mt-6`}>
                                <Button
                                    type={'button'}
                                    isSecondary
                                    css={tw`w-full sm:w-auto sm:mr-2`}
                                    onClick={() => setVisible(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    css={tw`w-full mt-4 sm:w-auto sm:mt-0`}
                                    type={'submit'}
                                    disabled={
                                        data.total.memory - 512 < 1 ||
                                        data.total.disk - bytesToMegabytes(stats) < 1 ||
                                        cpuDisponivel - 1 < 1
                                    }
                                >
                                    Dividir este servidor
                                </Button>
                            </div>
                        </Form>
                    </Modal>
                )}
            </Formik>
            <Button onClick={() => setVisible(true)}>Dividir</Button>
        </>
    );
};
