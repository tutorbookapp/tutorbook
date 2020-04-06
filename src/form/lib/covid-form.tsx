import React from 'react'

import { Typography } from '@rmwc/typography'
import { TextField } from '@rmwc/textfield'
import { Select } from '@rmwc/select'
import { Card } from '@rmwc/card'

import Button from '@tutorbook/button'
import Spinner from '@tutorbook/spinner'
import SubjectSelect from '@tutorbook/subject-select'
import LoadingOverlay from '@tutorbook/animated-checkmark-overlay'

import styles from './covid-form.module.scss'

interface InputProps { 
  readonly el: 'textfield' | 'textarea' | 'select' | 'subjectselect';
  readonly label: string;
  readonly type?: 'email' | 'tel' | 'text';
  readonly [propName: string]: any;
}

interface FormProps { 
  inputs: InputProps[]; 
  submitLabel: string;
  title: string;
  description: string;
  onSubmit: (formValues: { 
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
    [formInputLabel: string]: string;
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
      switch (input.el) {
        case 'textfield':
          this.inputs.push(<TextField 
            {...input} 
            onChange={event => this.handleChange(input, event)}
            key={index}
            outlined 
            className={styles.formField} 
          />);
          break;
        case 'textarea':
          this.inputs.push(<TextField 
            {...input}
            onChange={event => this.handleChange(input, event)}
            key={index}
            outlined 
            textarea
            rows={4}
            className={styles.formField} 
          />);
          break;
        case 'select':
          this.inputs.push(<Select 
            {...input} 
            onChange={event => this.handleChange(input, event)}
            key={index} 
            outlined 
            className={styles.formField}
          />);
          break;
        case 'subjectselect':
          this.inputs.push(<SubjectSelect
            {...input}
            onChange={event => this.handleChange(input, event)}
            key={index}
            outlined
            className={styles.formField}
          />);
          break;
      }
    });
  }

  handleChange(
    input: InputProps, 
    event: React.SyntheticEvent<(HTMLInputElement | HTMLSelectElement)>,
  ) {
    this.values[input.label] = 
      (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  async submit(event: React.SyntheticEvent): Promise<void> {
    event.preventDefault();
    this.setState({
      submitting: true,
    });
    await this.props.onSubmit(this.values);
    this.setState({
      submitted: true,
    });
  }

  render(): JSX.Element {
    return (
      <div className={styles.formWrapper}>
        <div className={styles.formContent}>
          <div className={styles.formTitle}>
            <Typography use='headline2'>
              {this.props.title}
            </Typography>
          </div>
          <div className={styles.formDescription}>
            <Typography use='body1'>
              {this.props.description}
            </Typography>
          </div>
          <Card className={styles.formCard}>
            <LoadingOverlay
              active={this.state.submitting || this.state.submitted}
              checked={this.state.submitted}
              label={this.state.submitted ? 'Submitted!' : 'Submitting form...'}
            />
            <form 
              className={styles.form} 
              onSubmit={this.submit}
            >
              {this.inputs}
              <Button 
                arrow
                className={styles.formSubmitButton}
                label={this.props.submitLabel}
                disabled={this.state.submitting || this.state.submitted}
                raised>
              </Button>
            </form>
          </Card>
        </div>
      </div>
    );
  }
}
