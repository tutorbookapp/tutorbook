import React from 'react';

import { Typography } from '@rmwc/typography';
import { TextField, TextFieldProps } from '@rmwc/textfield';
import { Select, SelectProps } from '@rmwc/select';
import { Card, CardProps } from '@rmwc/card';

import Button from '@tutorbook/button';
import Spinner from '@tutorbook/spinner';
import SubjectSelect, { SubjectSelectProps } from '@tutorbook/subject-select';
import ScheduleInput, { ScheduleInputProps } from '@tutorbook/schedule-input';
import LoadingOverlay from '@tutorbook/animated-checkmark-overlay';
import { SubjectsInterface, Availability } from '@tutorbook/model';

import styles from './covid-form.module.scss';

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
  (SubjectSelectProps | ScheduleInputProps | TextFieldProps | SelectProps);

interface FormProps extends React.HTMLProps<HTMLFormElement> {
  readonly inputs: InputProps[];
  readonly submitLabel: string;
  readonly cardProps?: CardProps & React.HTMLProps<HTMLDivElement>;
  readonly title?: string;
  readonly description?: string;
  readonly onFormSubmit: (formValues: {
    readonly [formInputLabel: string]: any;
  }) => Promise<any>;
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
    this.submit = this.submit.bind(this);
  }

  /**
   * Renders the input React components from the given array of `InputProps`.
   * @todo Perhaps revert back to rendering once (in the constructor) and using
   * a `this.inputs` field to improve performance.
   */
  private renderInputs(): JSX.Element[] {
    return this.props.inputs.map((input: InputProps, index: number) => {
      const { el, ...props } = input;
      switch (el) {
        case 'textfield':
          return (
            <TextField
              {...(props as TextFieldProps)}
              onChange={(event) => this.handleInputChange(input, event)}
              key={index}
              outlined
              className={styles.formField}
            />
          );
        case 'textarea':
          return (
            <TextField
              {...(props as TextFieldProps)}
              onChange={(event) => this.handleInputChange(input, event)}
              key={index}
              outlined
              textarea
              rows={4}
              className={styles.formField}
            />
          );
        case 'select':
          return (
            <Select
              {...(props as SelectProps)}
              onChange={(event) => this.handleInputChange(input, event)}
              key={index}
              outlined
              enhanced
              className={styles.formField}
            />
          );
        case 'subjectselect':
          return (
            <SubjectSelect
              {...(props as SubjectSelectProps)}
              onChange={(subjects: string[]) => {
                this.values[input.key ? input.key : input.label] = {
                  explicit: subjects,
                  implicit: [],
                } as SubjectsInterface;
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
                this.values[input.key ? input.key : input.label] = availability;
              }}
              key={index}
              outlined
              className={styles.formField}
            />
          );
      }
    });
  }

  /**
   * Handles changes for a text field or select input component.
   */
  private handleInputChange(
    input: UniqueInputProps & (TextFieldProps | SelectProps),
    event: React.SyntheticEvent<HTMLInputElement | HTMLSelectElement>
  ): void {
    this.values[input.key ? input.key : input.label] = (event.target as
      | HTMLInputElement
      | HTMLSelectElement).value;
  }

  /**
   * Submits the current form values (stored in `this.values`).
   * @todo Catch any submission errors using `await-to-js`.
   */
  private async submit(event: React.SyntheticEvent): Promise<void> {
    event.preventDefault();
    this.setState({ submitting: true });
    await this.props.onFormSubmit(this.values);
    this.setState({ submitted: true });
  }

  public render(): JSX.Element {
    const {
      title,
      description,
      submitLabel,
      onFormSubmit,
      inputs,
      className,
      cardProps,
      ...rest
    } = this.props;
    return (
      <>
        {title ? (
          <div className={styles.formTitle}>
            <Typography use='headline2'>{title}</Typography>
          </div>
        ) : undefined}
        {description ? (
          <div className={styles.formDescription}>
            <Typography use='body1'>{description}</Typography>
          </div>
        ) : undefined}
        <Card
          {...cardProps}
          className={
            styles.formCard +
            (cardProps && cardProps.className ? ' ' + cardProps.className : '')
          }
        >
          <LoadingOverlay
            active={this.state.submitting || this.state.submitted}
            checked={this.state.submitted}
            label={this.state.submitted ? 'Submitted!' : 'Submitting form...'}
          />
          <form
            {...rest}
            className={styles.form + (className ? ' ' + className : '')}
            onSubmit={this.submit}
          >
            {this.renderInputs()}
            <Button
              arrow
              className={styles.formSubmitButton}
              label={submitLabel}
              disabled={this.state.submitting || this.state.submitted}
              raised
            ></Button>
          </form>
        </Card>
      </>
    );
  }
}
