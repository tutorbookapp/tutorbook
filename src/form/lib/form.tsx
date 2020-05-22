import React from 'react';

import { TextField, TextFieldProps, TextFieldHTMLProps } from '@rmwc/textfield';
import { Select, SelectProps, SelectHTMLProps } from '@rmwc/select';
import { Card, CardProps } from '@rmwc/card';

import Button from '@tutorbook/button';
import SubjectSelect, { SubjectSelectProps } from '@tutorbook/subject-select';
import ScheduleInput, { ScheduleInputProps } from '@tutorbook/schedule-input';
import CheckmarkOverlay from '@tutorbook/checkmark-overlay';
import { Availability } from '@tutorbook/model';

import styles from './form.module.scss';

export type InputElAlias =
  | 'textfield'
  | 'textarea'
  | 'select'
  | 'subjectselect'
  | 'scheduleinput';

interface UniqueInputProps {
  readonly el: InputElAlias;
  readonly label: string;
  readonly key?: string;
}

type InputProps = UniqueInputProps &
  (
    | SubjectSelectProps
    | ScheduleInputProps
    | (TextFieldProps & TextFieldHTMLProps)
    | (SelectProps & SelectHTMLProps)
  );

interface CustomInputProps {
  readonly el: JSX.Element;
}

type Input = InputProps | CustomInputProps;

interface FormProps extends React.HTMLProps<HTMLFormElement> {
  readonly inputs: ReadonlyArray<Input>;
  readonly submitLabel: string;
  readonly cardProps?: CardProps & React.HTMLProps<HTMLDivElement>;
  readonly onFormSubmit: (formValues: {
    readonly [formInputLabel: string]: any;
  }) => Promise<any>;
  readonly loadingLabel?: boolean;
  readonly loadingCheckmark?: boolean;
}

interface FormState {
  readonly submitting: boolean;
  readonly submitted: boolean;
}

export default class Form extends React.Component<FormProps, {}> {
  public readonly state: FormState = {
    submitting: false,
    submitted: false,
  };
  private readonly values: {
    [formInputLabel: string]: any;
  } = {};

  public constructor(props: FormProps) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * Renders the input React components from the given array of `InputProps`.
   * @todo Perhaps revert back to rendering once (in the constructor) and using
   * a `this.inputs` field to improve performance.
   */
  private renderInputs(): JSX.Element[] {
    return this.props.inputs.map((input: Input, index: number) => {
      const { el, ...props } = input;
      switch (el) {
        case 'textfield':
          return (
            <TextField
              onChange={(event) =>
                this.handleInputChange(input as InputProps, event)
              }
              key={index}
              outlined
              className={styles.formField}
              {...(props as TextFieldProps)}
            />
          );
        case 'textarea':
          return (
            <TextField
              onChange={(event) =>
                this.handleInputChange(input as InputProps, event)
              }
              key={index}
              outlined
              textarea
              rows={4}
              className={styles.formField}
              {...(props as TextFieldProps)}
            />
          );
        case 'select':
          return (
            <Select
              onChange={(event) =>
                this.handleInputChange(input as InputProps, event)
              }
              key={index}
              outlined
              enhanced
              className={styles.formField}
              {...(props as SelectProps)}
            />
          );
        case 'subjectselect':
          return (
            <SubjectSelect
              {...(props as SubjectSelectProps)}
              onChange={(subjects: string[]) => {
                let props: InputProps = input as InputProps;
                this.values[props.key ? props.key : props.label] = subjects;
              }}
              key={index}
              outlined
              className={styles.formField}
            />
          );
        case 'scheduleinput':
          return (
            <ScheduleInput
              {...(props as ScheduleInputProps)}
              onChange={(availability: Availability) => {
                let props: InputProps = input as InputProps;
                this.values[props.key ? props.key : props.label] = availability;
              }}
              key={index}
              outlined
              className={styles.formField}
            />
          );
        default:
          return el;
      }
    });
  }

  /**
   * Handles changes for a text field or select input component.
   */
  private handleInputChange(
    input: UniqueInputProps & (TextFieldProps | SelectProps),
    evt: React.FormEvent<HTMLInputElement | HTMLSelectElement>
  ): void {
    this.values[input.key ? input.key : input.label] = evt.currentTarget.value;
  }

  /**
   * Submits the current form values (stored in `this.values`).
   * @todo Catch any submission errors using `await-to-js`.
   */
  private async handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    this.setState({ submitting: true });
    await this.props.onFormSubmit(this.values);
    this.setState({ submitted: true });
  }

  public render(): JSX.Element {
    const {
      submitLabel,
      onFormSubmit,
      inputs,
      className,
      cardProps,
      loadingCheckmark,
      ...rest
    } = this.props;
    return (
      <Card
        {...cardProps}
        className={
          styles.formCard +
          (cardProps && cardProps.className ? ' ' + cardProps.className : '')
        }
      >
        <CheckmarkOverlay
          active={this.state.submitting || this.state.submitted}
          checked={!!this.props.loadingCheckmark && this.state.submitted}
          label={this.state.submitted ? 'Submitted!' : 'Submitting form...'}
          showLabel={!!this.props.loadingLabel}
        />
        <form
          {...rest}
          className={styles.form + (className ? ' ' + className : '')}
          onSubmit={this.handleSubmit}
        >
          {this.renderInputs()}
          {this.props.children}
          <Button
            className={styles.formSubmitButton}
            label={submitLabel}
            disabled={this.state.submitting || this.state.submitted}
            raised
            arrow
          />
        </form>
      </Card>
    );
  }
}
