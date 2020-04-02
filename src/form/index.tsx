import React from 'react'

import { TextField } from '@rmwc/textfield'
import { Select } from '@rmwc/select'
import { Button } from '@rmwc/button'
import { Card } from '@rmwc/card'

import ArrowButton from '@tutorbook/arrow-btn'
import Spinner from '@tutorbook/spinner'

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
}

interface FormState {
  readonly submitting: boolean;
  readonly submitted: boolean;
}

export default class Form extends React.Component<FormProps, {}> {
  readonly state: FormState;

  constructor(props: FormProps) {
    super(props);
    this.state = {
      submitting: false,
      submitted: false,
    };
  }

  createInputs(): JSX.Element[] {
    const inputs: JSX.Element[] = [];
    this.props.inputs.map((input, index) => {
      switch (input.el) {
        case 'textfield':
          inputs.push(<TextField 
            className={styles.formField} 
            outlined 
            key={index} 
            {...input} 
          />);
          break;
        case 'textarea':
          inputs.push(<TextField 
            className={styles.formField} 
            outlined 
            textarea
            key={index}
            rows={4}
            {...input}
          />);
          break;
        case 'select':
          inputs.push(<Select 
            className={styles.formField} 
            outlined 
            key={index} 
            {...input} 
          />);
          break;
      }
    });
    return inputs;
  }

  submit(event: React.SyntheticEvent): void {
    event.preventDefault();
    this.setState({
      submitting: true,
      submitted: false,
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
            <Spinner active={this.state.submitting} />
            <form 
              className={styles.form} 
              onSubmit={e => this.submit(e)}
            >
              {this.createInputs()}
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
