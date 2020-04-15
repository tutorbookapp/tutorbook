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
import { AvailabilityAlias } from '@tutorbook/model';

import styles from './covid-form.module.scss';

// TODO: Make this somehow extend all the above imported props simultaneously.
interface InputProps {
  readonly el:
    | 'textfield'
    | 'textarea'
    | 'select'
    | 'subjectselect'
    | 'scheduleinput';
  readonly label: string;
  readonly type?: 'email' | 'tel' | 'text';
  readonly [propName: string]: any;
}

interface FormProps extends React.HTMLProps<HTMLFormElement> {
  inputs: InputProps[];
  submitLabel: string;
  cardProps?: CardProps & React.HTMLProps<HTMLDivElement>;
  title?: string;
  description?: string;
  onFormSubmit: (formValues: {
    readonly [formInputLabel: string]: string;
  }) => Promise<void>;
}

interface FormState {
  readonly submitting: boolean;
  readonly submitted: boolean;
}

export default class Form extends React.Component<FormProps, {}> {
  readonly state: FormState;
  readonly inputs: JSX.Element[];
  readonly values: {
    [formInputLabel: string]: any;
  };

  constructor(props: FormProps) {
    super(props);
    this.values = {};
    this.inputs = [];
    this.renderInputs();
    this.state = {
      submitting: false,
      submitted: false,
    };
    this.submit = this.submit.bind(this);
  }

  renderInputs(): void {
    this.props.inputs.map((input, index) => {
      const { el, ...props } = input;
      switch (el) {
        case 'textfield':
          this.inputs.push(
            <TextField
              {...props}
              onChange={(event) => this.handleChange(input, event)}
              key={index}
              outlined
              className={styles.formField}
            />
          );
          break;
        case 'textarea':
          this.inputs.push(
            <TextField
              {...props}
              onChange={(event) => this.handleChange(input, event)}
              key={index}
              outlined
              textarea
              rows={4}
              className={styles.formField}
            />
          );
          break;
        case 'select':
          this.inputs.push(
            <Select
              {...props}
              onChange={(event) => this.handleChange(input, event)}
              key={index}
              outlined
              enhanced
              className={styles.formField}
            />
          );
          break;
        case 'subjectselect':
          this.inputs.push(
            <SubjectSelect
              {...props}
              onChange={(subjects: string[]) => {
                this.values[input.label] = subjects;
              }}
              key={index}
              outlined
              className={styles.formField}
            />
          );
          break;
        case 'scheduleinput':
          this.inputs.push(
            <ScheduleInput
              {...props}
              onChange={(availability: AvailabilityAlias) => {
                this.values[input.label] = availability;
              }}
              key={index}
              outlined
              className={styles.formField}
            />
          );
          break;
      }
    });
  }

  handleChange(
    input: InputProps,
    event: React.SyntheticEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    this.values[input.label] = (event.target as
      | HTMLInputElement
      | HTMLSelectElement).value;
  }

  async submit(event: React.SyntheticEvent): Promise<void> {
    event.preventDefault();
    this.setState({
      submitting: true,
    });
    await this.props.onFormSubmit(this.values);
    this.setState({
      submitted: true,
    });
  }

  render(): JSX.Element {
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
            {this.inputs}
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
