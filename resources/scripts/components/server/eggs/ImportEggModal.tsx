import React, { useEffect, useState } from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Field, Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import { boolean, object, string } from 'yup';
import { ServerContext } from '@/state/server';
import FormikSwitch from '@/components/elements/FormikSwitch';
import importEgg, { ImportEggData } from '@/api/server/eggs/importEgg';
import Label from '@/components/elements/Label';
import InputError from '@/components/elements/InputError';

type Props = {
    onChange: () => void;
} & RequiredModalProps;

interface Values {
    eggJson: string;
    reinstallServer: boolean;
}

const ImportEggModal = ({ ...props }: Omit<Props, 'onImportEggUpdated'>) => {
    const { isSubmitting, errors, touched, setFieldValue, values } = useFormikContext<Values>();
    const [inputMode, setInputMode] = useState<'file' | 'text'>('text');

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setFieldValue('eggJson', content);
            };
            reader.readAsText(file);
        } else if (file) {
            alert('Por favor, selecione apenas arquivos JSON (.json)');
            event.target.value = '';
        }
    };

    return (
        <Modal {...props} showSpinnerOverlay={isSubmitting}>
            <h3 css={tw`text-2xl mb-6`}>Importar Egg Personalizado</h3>
            <FlashMessageRender byKey={'server:eggs:import'} css={tw`mb-6`} />
            <Form>
                <div css={tw`mb-6`}>
                    <Label htmlFor={'eggJson'}>JSON do Egg</Label>

                    {/* Botões para alternar entre modos */}
                    <div css={tw`flex mb-3 space-x-2`}>
                        <Button
                            type='button'
                            size='small'
                            color={inputMode === 'text' ? 'primary' : 'grey'}
                            onClick={() => setInputMode('text')}
                        >
                            Colar JSON
                        </Button>
                        <Button
                            type='button'
                            size='small'
                            color={inputMode === 'file' ? 'primary' : 'grey'}
                            onClick={() => setInputMode('file')}
                        >
                            Selecionar Arquivo
                        </Button>
                    </div>

                    {/* Input de arquivo */}
                    {inputMode === 'file' && (
                        <div css={tw`mb-3`}>
                            <input
                                type='file'
                                accept='.json,application/json'
                                onChange={handleFileSelect}
                                css={tw`block w-full text-sm text-neutral-500`}
                            />
                            <p css={tw`text-xs text-neutral-400 mt-1`}>
                                Selecione um arquivo JSON (.json) contendo o egg personalizado.
                            </p>
                        </div>
                    )}

                    {/* Textarea para colar JSON */}
                    {inputMode === 'text' && (
                        <>
                            <Field
                                as={'textarea'}
                                id={'eggJson'}
                                name={'eggJson'}
                                css={tw`block w-full h-32 p-3 border border-neutral-200 rounded text-sm resize-none`}
                                placeholder={'Cole aqui o JSON do seu egg personalizado...'}
                            />
                            <p css={tw`text-xs text-neutral-400 mt-2`}>
                                Cole o JSON completo do egg que você deseja importar. Certifique-se de que o formato
                                está correto.
                            </p>
                        </>
                    )}

                    {/* Preview do JSON quando arquivo for selecionado */}
                    {inputMode === 'file' && values.eggJson && (
                        <div css={tw`mt-3`}>
                            <Label>Preview do JSON:</Label>
                            <div
                                css={tw`block w-full h-32 p-3 border border-neutral-200 rounded text-sm bg-neutral-50 overflow-auto`}
                            >
                                <pre css={tw`text-xs whitespace-pre-wrap`}>
                                    {values.eggJson.substring(0, 500)}
                                    {values.eggJson.length > 500 ? '...' : ''}
                                </pre>
                            </div>
                        </div>
                    )}

                    <InputError errors={errors} touched={touched} name={'eggJson'} />
                </div>
                <div css={tw`flex flex-wrap mt-5`}>
                    <div css={tw`w-full`}>
                        <FormikSwitch
                            name={'reinstallServer'}
                            description={
                                'Se habilitado, o servidor será reinstalado com o novo egg. Se não, apenas o egg será alterado.'
                            }
                            label={'Reinstalar Servidor'}
                        />
                    </div>
                </div>
                <div css={tw`mt-6 text-right`}>
                    <Button css={tw`w-full sm:w-auto`} type={'submit'} disabled={isSubmitting}>
                        Importar Egg
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ({ onChange, visible, ...props }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [modalVisible, setModalVisible] = useState(visible);

    useEffect(() => {
        setModalVisible(visible);
        clearFlashes('server:eggs:import');
    }, [visible]);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('server:eggs:import');

        // Validar se o JSON é válido e tem a estrutura correta do egg
        const validateJson = (jsonString: string): { isValid: boolean; error?: string } => {
            try {
                const parsed = JSON.parse(jsonString);

                // Validação básica da estrutura do egg
                if (!parsed.name || typeof parsed.name !== 'string') {
                    return { isValid: false, error: 'O JSON deve conter um campo "name" válido.' };
                }

                if (
                    !parsed.docker_images ||
                    typeof parsed.docker_images !== 'object' ||
                    Object.keys(parsed.docker_images).length === 0
                ) {
                    return { isValid: false, error: 'O JSON deve conter um campo "docker_images" válido.' };
                }

                if (!parsed.startup || typeof parsed.startup !== 'string') {
                    return { isValid: false, error: 'O JSON deve conter um campo "startup" válido.' };
                }

                return { isValid: true };
            } catch (error) {
                return { isValid: false, error: 'JSON inválido. Verifique a sintaxe.' };
            }
        };

        const validation = validateJson(values.eggJson);
        if (!validation.isValid) {
            clearAndAddHttpError({
                key: 'server:eggs:import',
                error: { message: validation.error || 'JSON inválido.' },
            });
            setSubmitting(false);
            return;
        }

        const importData: ImportEggData = {
            eggJson: values.eggJson,
            reinstallServer: values.reinstallServer,
            autoApply: true,
        };

        importEgg(uuid, importData)
            .then(() => {
                setModalVisible(false);
                setSubmitting(false);
                addFlash({
                    key: 'server:eggs:import',
                    message: 'Egg personalizado importado com sucesso!',
                    type: 'success',
                    title: 'Sucesso',
                });
                onChange();
            })
            .catch((error) => {
                clearAndAddHttpError({ key: 'server:eggs:import', error });
                setSubmitting(false);
            });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                eggJson: '',
                reinstallServer: false,
            }}
            validationSchema={object().shape({
                eggJson: string().required('O JSON do egg é obrigatório.'),
                reinstallServer: boolean(),
            })}
        >
            <ImportEggModal visible={modalVisible} onChange={onChange} {...props} />
        </Formik>
    );
};
