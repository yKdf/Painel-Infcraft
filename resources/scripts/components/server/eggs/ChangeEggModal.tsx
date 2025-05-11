import React, { useEffect, useState } from 'react';
import Modal, { RequiredModalProps } from '@/components/elements/Modal';
import { Form, Formik, FormikHelpers, useFormikContext } from 'formik';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import { boolean, object } from 'yup';
import { ServerContext } from '@/state/server';
import FormikSwitch from '@/components/elements/FormikSwitch';
import changeEgg from '@/api/server/eggs/changeEgg';

type Props = {
    eggId: number;
    onChange: () => void;
} & RequiredModalProps;

interface Values {
    reinstallServer: boolean;
}

const ChangeEggModal = ({ ...props }: Omit<Props, 'onEggChangerEggUpdated'>) => {
    const { isSubmitting } = useFormikContext();

    return (
        <Modal {...props} showSpinnerOverlay={isSubmitting}>
            <h3 css={tw`text-2xl mb-6`}>Change Egg</h3>
            <FlashMessageRender byKey={'server:splitter:eggs'} css={tw`mb-6`} />
            <Form>
                <div css={tw`flex flex-wrap mt-5`}>
                    <div css={tw`w-full`}>
                        <FormikSwitch
                            name={'reinstallServer'}
                            description={'If enabled, the server will be reinstalled, if not, only the egg will be changed.'}
                            label={'Reinstall Server'}
                        />
                    </div>
                </div>
                <div css={tw`mt-6 text-right`}>
                    <Button css={tw`w-full sm:w-auto`} type={'submit'} disabled={isSubmitting}>
                        Change Egg
                    </Button>
                </div>
            </Form>
        </Modal>
    );
};

export default ({ eggId, onChange, visible, ...props }: Props) => {
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const { clearFlashes, clearAndAddHttpError, addFlash } = useFlash();
    const [ modalVisible, setModalVisible ] = useState(visible);

    useEffect(() => {
        setModalVisible(visible);
        clearFlashes('server:eggs');
    }, [ visible ]);

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('server:eggs');

        changeEgg(uuid, eggId, values.reinstallServer).then(() => {
            setModalVisible(false);
            setSubmitting(false);
            addFlash({ key: 'server:eggs', message: 'You\'ve successfully changed the egg.', type: 'success', title: 'Success' });
            onChange();
        }).catch(error => {
            clearAndAddHttpError({ key: 'server:eggs', error });
            setSubmitting(false);
        });
    };

    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                reinstallServer: false,
            }}
            validationSchema={object().shape({
                reinstallServer: boolean(),
            })}
        >
            <ChangeEggModal
                visible={modalVisible}
                eggId={eggId}
                onChange={onChange}
                {...props}
            />
        </Formik>
    );
};
