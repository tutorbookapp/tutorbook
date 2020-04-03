import React from 'react'

import { TextField } from '@rmwc/textfield'
import { Select } from '@rmwc/select'
import { Button } from '@rmwc/button'
import { Card } from '@rmwc/card'

import ArrowButton from '@tutorbook/arrow-btn'
import Spinner from '@tutorbook/spinner'
import LoadingOverlay from '@tutorbook/animated-checkmark-overlay'

import styles from './index.module.scss'

interface InputProps { 
  readonly el: 'textfield' | 'textarea' | 'select';
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
            className={styles.formField} 
            onChange={event => this.handleChange(input, event)}
            key={index}
            outlined 
            {...input} 
          />);
          break;
        case 'textarea':
          this.inputs.push(<TextField 
            className={styles.formField} 
            onChange={event => this.handleChange(input, event)}
            key={index}
            outlined 
            textarea
            rows={4}
            {...input}
          />);
          break;
        case 'select':
          this.inputs.push(<Select 
            className={styles.formField}
            onChange={event => this.handleChange(input, event)}
            key={index} 
            outlined 
            {...input} 
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
          <h1 className={styles.formTitle}>
            {this.props.title}
          </h1>
          <p className={styles.formDescription}>
            {this.props.description}
          </p>
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
              <ArrowButton 
                className={styles.formSubmitButton}
                label={this.props.submitLabel}
                disabled={this.state.submitting || this.state.submitted}
                raised>
              </ArrowButton>
            </form>
          </Card>
        </div>
      </div>
    );
  }
}
