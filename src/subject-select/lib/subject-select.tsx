import React from 'react'
import { List, ListItem, ListItemGraphic } from '@rmwc/list'
import { MenuSurfaceAnchor, MenuSurface } from '@rmwc/menu'
import { TextField, TextFieldProps } from '@rmwc/textfield'
import { ChipSet, Chip } from '@rmwc/chip'
import { Checkbox } from '@rmwc/checkbox'

import styles from './subject-select.module.scss'

interface SubjectSelectState {
  suggestionsOpen: boolean;
  subjects: { [subject: string]: boolean; };
}

interface SubjectSelectProps extends TextFieldProps {
  onChange: (event: React.SyntheticEvent<HTMLInputElement>) => any;
  className?: string;
}

export default class SubjectSelect extends React.Component<SubjectSelectProps> {
  state: SubjectSelectState;
  mostRecentClosureEvent: React.SyntheticEvent<HTMLInputElement> | undefined;
  static subjects: string[] = [
    'Algebra 1',
    'Algebra 2',
    'Algebra 2 / Trigonometry H',
    'Geometry H',
    'Chemistry H',
    'Biology H',
    'AP Chemistry',
    'AP Biology',
    'AP Physics C',
    'AP Art History',
  ];

  constructor(props: SubjectSelectProps) {
    super(props);
    this.state = {
      suggestionsOpen: false,
      subjects: {},
    };
    SubjectSelect.subjects.map(subject => this.state.subjects[subject] = false);
    this.onTextFieldChange = this.onTextFieldChange.bind(this);
    this.openSuggestions = this.openSuggestions.bind(this);
    this.closeSuggestions = this.closeSuggestions.bind(this);
  }

  onTextFieldChange(event: React.SyntheticEvent<HTMLInputElement>) {
    console.log('[TODO] Show subject suggestions.');
  }

  openSuggestions() {
    this.setState({ suggestionsOpen: true });
  }

  closeSuggestions(event: React.SyntheticEvent<HTMLInputElement>) {
    this.setState({ suggestionsOpen: false });
  }

  render() {
    return (
      <MenuSurfaceAnchor className={this.props.className}>
        <MenuSurface
          open={this.state.suggestionsOpen}
          anchorCorner='bottomStart'
        >
          <List>
            {this.renderSubjectMenuItems()}
          </List>
        </MenuSurface>
        <TextField 
          outlined
          onFocus={this.openSuggestions}
          onBlur={this.closeSuggestions}
          onChange={this.onTextFieldChange}
          label={this.props.label}
          className={styles.textField}
        >
        </TextField>
      </MenuSurfaceAnchor>
    );
  }

  selectSubject(subject: string) {
    this.setState({
      subjects: {
        ...this.state.subjects, 
        [subject]: !this.state.subjects[subject]
      },
    });
  }

  renderSubjectMenuItems() {
    const subjectMenuItems: JSX.Element[] = [];
    SubjectSelect.subjects.map(subject => subjectMenuItems.push(
      <ListItem 
        key={subject} 
        onClick={() => this.selectSubject(subject)}
        className={styles.menuItem}
      >
        <ListItemGraphic icon={
          <Checkbox checked={this.state.subjects[subject]} readOnly />
        } />
        {subject}
      </ListItem>
    ));
    return subjectMenuItems;
  }
}
