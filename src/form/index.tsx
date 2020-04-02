import React from 'react'

import { TextField } from '@rmwc/textfield'
import { Select } from '@rmwc/select'
import { Card } from '@rmwc/card'

import styles from './index.module.scss'

interface Input { 
  readonly el: 'textfield' | 'textarea' | 'select';
  readonly label: string;
  readonly type?: 'email' | 'tel' | 'text';
  readonly [propName: string]: any;
}

interface FormProps { inputs: Input[]; }

export default class Form extends React.Component<FormProps, {}> {
  createInputs() {
    const inputs = [];
    for (const input of this.props.inputs) {
      switch (input.el) {
        case 'textfield':
          inputs.push(<TextField outlined {...input} />);
          break;
        case 'textarea':
          inputs.push(<TextField 
            outlined 
            textarea
            rows={8}
            maxLength={20}
            {...input}
          />);
          break;
        case 'select':
          inputs.push(<Select outlined {...input} />);
          break;
      }
    }
    return inputs;
  }

  render() {
    return (
      <Card>
        {this.createInputs()}
      </Card>
    );
  }
}
