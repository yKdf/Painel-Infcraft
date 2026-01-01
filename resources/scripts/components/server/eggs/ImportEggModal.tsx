import React, { useEffect, useState } from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import Button from '@/components/elements/Button';
import { boolean, object, string } from 'yup';
import { ServerContext } from '@/state/server';
import FormikSwitch from '@/components/elements/FormikSwitch';
import importEgg, { ImportEggData } from '@/api/server/eggs/importEgg';
import Label from '@/components/elements/Label';
import InputError from '@/components/elements/InputError';

type Props = {
    onChange: () => void;
    onEggImported?: (eggId: number) => void;
} & RequiredModalProps;

interface Values {
    eggJson: string;
    reinstallServer: boolean;
}

const FileInputContainer = styled.div`
    ${tw`relative`};
`;

const FileInput = styled.input`
    ${tw`block w-full text-sm text-neutral-200 cursor-pointer bg-neutral-600 border-2 border-neutral-500 hover:border-neutral-400 rounded p-3 transition-all duration-150`};

    &:focus {
        ${tw`outline-none border-primary-300 ring-2 ring-primary-400 ring-opacity-50`};
    }

    &::file-selector-button {
        ${tw`mr-4 py-2 px-4 rounded border-0 text-sm font-medium bg-primary-500 text-primary-50 cursor-pointer transition-colors duration-150`};
    }

    &:hover::file-selector-button {
        ${tw`bg-primary-600`};
    }
`;

const PreviewContainer = styled.div`
    ${tw`mt-4 p-4 bg-neutral-700 border border-neutral-600 rounded-lg`};
`;

const PreviewContent = styled.pre`
    ${tw`text-xs text-neutral-300 whitespace-pre-wrap font-mono overflow-auto max-h-32`};
`;

const ModalTitle = styled.h3`
    ${tw`text-2xl font-semibold text-neutral-100 mb-6 flex items-center`};
`;

const DescriptionText = styled.p`
    ${tw`text-xs text-neutral-400 mt-2`};
`;

const ImportEggModal = ({ ...props }: Omit<Props, 'onImportEggUpdated'>) => {
    const { isSubmitting, errors, touched, setFieldValue, values } = useFormikContext<Values>();

    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setFieldValue('eggJson', content);
                clearFlashes('server:eggs:import');
            };
            reader.readAsText(file);
        } else if (file) {
            clearAndAddHttpError({
                key: 'server:eggs:import',
                error: 'Por favor, selecione apenas arquivos JSON (.json)',
            });
            event.target.value = '';
        }
    };

    return (
        <Modal {...props} showSpinnerOverlay={isSubmitting}>
            <ModalTitle>Importar Egg Personalizado</ModalTitle>
            <FlashMessageRender byKey={'server:eggs:import'} css={tw`mb-6`} />
            <Form css={tw`space-y-6`}>
                <div>
                    <Label htmlFor={'eggJson'} css={tw`text-neutral-200 font-medium mb-3 block`}>
                        Arquivo JSON do Egg
                    </Label>

                    <FileInputContainer>
                        <FileInput
                            type='file'
                            accept='.json,application/json'
                            onChange={handleFileSelect}
                            id='eggJson'
                        />
                        <DescriptionText>
                            Selecione um arquivo JSON (.json) contendo a configuração do egg personalizado.
                        </DescriptionText>
                    </FileInputContainer>

                    {/* Preview do JSON quando arquivo for selecionado */}
                    {values.eggJson && (
                        <PreviewContainer>
                            <Label css={tw`text-neutral-200 font-medium mb-2 block`}>Preview do JSON:</Label>
                            <PreviewContent>
                                {values.eggJson.substring(0, 500)}
                                {values.eggJson.length > 500 ? '\n\n... (conteúdo truncado)' : ''}
                            </PreviewContent>
                        </PreviewContainer>
                    )}
                    <InputError errors={errors} touched={touched} name={'eggJson'} />
                </div>
                <div css={tw`bg-neutral-700 p-4 rounded-lg border border-neutral-600`}>
                    <FormikSwitch
                        name={'reinstallServer'}
                        description={
                            'Se habilitado, o servidor será completamente reinstalado com o novo egg. Se desabilitado, apenas o egg será alterado mantendo os arquivos existentes.'
                        }
                        label={'Reinstalar Servidor'}
                    />
                </div>
                <div css={tw`flex justify-end space-x-3 pt-4 border-t border-neutral-600`}>
                    <Button type={'button'} isSecondary onClick={() => props.onDismissed()} css={tw`px-6`}>
                        Cancelar
                    </Button>
                    <Button
                        type={'submit'}
                        disabled={isSubmitting || !values.eggJson}
                        isLoading={isSubmitting}
                        color={'primary'}
                        css={tw`px-6`}
                    >
                        {isSubmitting ? 'Importando...' : 'Importar Egg'}
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

        // Add thumbnail URL to the egg JSON
        let modifiedEggJson = values.eggJson;
        try {
            const eggData = JSON.parse(values.eggJson);
            eggData.thumbnail = 'https://infcraft.net/assets/icon/Infcraft-Dark.svg';
            modifiedEggJson = JSON.stringify(eggData);
        } catch (error) {
            // If JSON parsing fails, use original JSON
            console.warn('Failed to add thumbnail to egg JSON:', error);
        }

        const importData: ImportEggData = {
            eggJson: modifiedEggJson,
            reinstallServer: values.reinstallServer,
            autoApply: true,
        };

        importEgg(uuid, importData)
            .then((response) => {
                setModalVisible(false);
                setSubmitting(false);
                addFlash({
                    key: 'server:eggs:import',
                    message: 'Egg personalizado importado com sucesso!',
                    type: 'success',
                    title: 'Sucesso',
                });

                // Call onEggImported with the imported egg ID if available
                if (props.onEggImported && response?.data?.egg?.id) {
                    props.onEggImported(response.data.egg.id);
                }

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
