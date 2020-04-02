import React from 'react'

import { TextField } from '@rmwc/textfield'
import { Select } from '@rmwc/select'
import { Card } from '@rmwc/card'

import styles from './index.module.scss'

interface InputProps { 
  readonly el: 'textfield' | 'textarea' | 'select';
  readonly label: string;
  readonly type?: 'email' | 'tel' | 'text';
  readonly [propName: string]: any;
}

interface FormProps { inputs: InputProps[]; }

export default class Form extends React.Component<FormProps, {}> {
  createInputs() {
    const inputs: JSX.Element[] = [];
    this.props.inputs.map((input, index) => {
      switch (input.el) {
        case 'textfield':
          inputs.push(<TextField outlined key={index} {...input} />);
          break;
        case 'textarea':
          inputs.push(<TextField 
            outlined 
            textarea
            key={index}
            rows={8}
            maxLength={20}
            {...input}
          />);
          break;
        case 'select':
          inputs.push(<Select outlined key={index} {...input} />);
          break;
      }
    });
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
