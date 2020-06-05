import React from 'react';

import { TextField, TextFieldProps } from '@rmwc/textfield';
import { v4 as uuid } from 'uuid';

import firebase from '@tutorbook/firebase';

import styles from './photo-input.module.scss';

type Reference = firebase.storage.Reference;

interface PhotoInputProps extends TextFieldProps {
  label: string;
  val: string;
  onChange: (url: string) => any;
}

export default function PhotoInput(props: PhotoInputProps): JSX.Element {
  const inputRef: React.RefObject<HTMLInputElement> = React.createRef();
  const helperRef: React.RefObject<HTMLParagraphElement> = React.createRef();

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.type = 'file';
      inputRef.current.accept = 'image/*';
      inputRef.current.style.display = 'none';
    }
  });

  const [value, setValue] = React.useState<string>(
    'Click the text field above to upload a photo.'
  );
  const [errored, setErrored] = React.useState<boolean>(false);
  const handleClick = (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (inputRef.current) inputRef.current.click();
    return false;
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
    const pathname: string =
      (process.env.NODE_ENV === 'development' ? 'test' : 'default') +
      `/temp/${uuid()}.${extension}`;
    const ref: Reference = firebase.storage().ref(pathname);

    setValue(`Uploading ${filename}.${extension}...`);

    ref.put(file).on(firebase.storage.TaskEvent.STATE_CHANGED, {
      next() {}, // See https://github.com/firebase/firebase-js-sdk/issues/3158
      async complete() {
        onChange(await ref.getDownloadURL());
        setValue(`Uploaded ${filename}.${extension}.`);
      },
      error(error: Error) {
        setErrored(true);
        setValue(
          `An error occurred while uploading ${filename}.${extension}. ${error.message}`
        );
      },
    });

    return false;
  };
  const { val, onChange, ...rest } = props;
  return (
    <TextField
      helpText={{
        persistent: true,
        validationMsg: errored,
        className: styles.helper,
        children: value,
        ref: helperRef,
      }}
      className={styles.textField}
      onChange={handleChange}
      inputRef={inputRef}
      invalid={errored}
      value=''
      {...rest}
    >
      <button className={styles.clickArea} onClick={handleClick} />
    </TextField>
  );
}
