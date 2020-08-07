import React from 'react';

import { TCallback } from 'lib/model';
import { TextField, TextFieldProps, TextFieldHTMLProps } from '@rmwc/textfield';
import { v4 as uuid } from 'uuid';

import styles from './photo-input.module.scss';

type TextFieldPropOverrides = 'helpText' | 'inputRef' | 'invalid';

interface UniquePhotoInputProps {
  label: string;
  value: string;
  onChange: TCallback<string>;
}

type Overrides = TextFieldPropOverrides | keyof UniquePhotoInputProps;

export type PhotoInputProps = Omit<TextFieldHTMLProps, Overrides> &
  Omit<TextFieldProps, Overrides> &
  UniquePhotoInputProps;

export default function PhotoInput({
  value,
  onChange,
  ...textFieldProps
}: PhotoInputProps): JSX.Element {
  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  const helperRef: React.RefObject<HTMLParagraphElement> = React.createRef();

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.type = 'file';
      inputRef.current.accept = 'image/*';
      inputRef.current.style.display = 'none';
    }
  });

  const [helperValue, setHelperValue] = React.useState<string>(
    'Click the text field above to upload a photo.'
  );
  const [errored, setErrored] = React.useState<boolean>(false);
  const handleClick = (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (inputRef.current) inputRef.current.click();
  };
  const handleChange = async (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!event.currentTarget.files || !event.currentTarget.files.length) return;

    setErrored(false);

    const file: File = event.currentTarget.files[0];
    const lastDotIndex: number = file.name.lastIndexOf('.');
    const filename: string = file.name.substring(0, lastDotIndex);
    const extension: string = file.name.substring(lastDotIndex + 1);
    const pathname = `${
      process.env.NODE_ENV === 'development' ? 'test' : 'default'
    }/temp/${uuid()}.${extension}`;

    setHelperValue(`Uploading ${filename}.${extension}...`);

    const { default: firebase } = await import('lib/firebase');
    await import('firebase/storage');

    const ref = firebase.storage().ref(pathname);

    ref.put(file).on(firebase.storage.TaskEvent.STATE_CHANGED, {
      next() {}, // See https://github.com/firebase/firebase-js-sdk/issues/3158
      async complete() {
        onChange(await ref.getDownloadURL());
        setHelperValue(`Uploaded ${filename}.${extension}.`);
      },
      error(error: Error) {
        setErrored(true);
        setHelperValue(
          `An error occurred while uploading ${filename}.${extension}. ${error.message}`
        );
      },
    });
  };
  /* eslint-disable jsx-a11y/control-has-associated-label */
  return (
    <TextField
      {...textFieldProps}
      helpText={{
        persistent: true,
        validationMsg: errored,
        className: styles.helper,
        children: helperValue,
        ref: helperRef,
      }}
      onChange={handleChange}
      inputRef={inputRef}
      invalid={errored}
      value=''
    >
      <button
        type='button'
        className={styles.clickArea}
        onClick={handleClick}
      />
    </TextField>
  );
  /* eslint-enable jsx-a11y/control-has-associated-label */
}
