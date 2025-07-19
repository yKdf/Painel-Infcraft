import React, { forwardRef } from 'react';
import { Field as FormikField, FieldProps } from 'formik';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import tw, { TwStyle } from 'twin.macro';

interface OwnProps {
    name: string;
    light?: boolean;
    label?: string;
    description?: string;
    cssstyle?: TwStyle;
    splittedavailable?: string;
    validate?: (value: any) => undefined | string | Promise<any>;
}

type Props = OwnProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'>;

const Field = forwardRef<HTMLInputElement, Props>(
    ({ id, name, light = false, label, description, validate, cssstyle, splittedavailable, ...props }, ref) => (
        <FormikField innerRef={ref} name={name} validate={validate}>
            {({ field, form: { errors, touched } }: FieldProps) => (
                <div css={cssstyle}>
                    <div>
                        {label && (
                            <Label htmlFor={id} isLight={light}>
                                {label}
                            </Label>
                        )}
                        <Input
                            id={id}
                            {...field}
                            {...props}
                            isLight={light}
                            hasError={!!(touched[field.name] && errors[field.name])}
                        />
                        {touched[field.name] && errors[field.name] ? (
                            <p className={'input-help error'}>
                                {(errors[field.name] as string).charAt(0).toUpperCase() +
                                    (errors[field.name] as string).slice(1)}
                            </p>
                        ) : description ? (
                            <>
                                <div className={'input-help'}>
                                    <p>{description}</p>
                                    <br />
                                    <a css={tw`text-white`}>{splittedavailable}</a>
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </FormikField>
    )
);
Field.displayName = 'Field';

export default Field;
