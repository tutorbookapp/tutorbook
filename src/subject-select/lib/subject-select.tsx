import React from 'react';
import { List, ListItem, ListItemGraphic } from '@rmwc/list';
import { MenuSurfaceAnchor, MenuSurface } from '@rmwc/menu';
import { TextField, TextFieldProps } from '@rmwc/textfield';
import { Chip } from '@rmwc/chip';
import { Checkbox } from '@rmwc/checkbox';
import { ObjectWithObjectID } from '@algolia/client-search';

import algoliasearch from 'algoliasearch/lite';
import styles from './subject-select.module.scss';

// TODO: Bring this up the React tree using `Context` and `Context.Provider`s.
const client = algoliasearch('XCRT9EA6O8', 'aa1d293ac39b27e9671ece379c217da0');

type SubjectsAlias = { [subject: string]: boolean };

interface SubjectSelectState {
  suggestionsOpen: boolean;
  suggestions: string[];
  subjects: SubjectsAlias;
  inputValueWorkaround: string;
}

export interface SubjectSelectProps extends TextFieldProps {
  onChange: (subjects: string[]) => any;
  className?: string;
  val?: string[];
}

interface SubjectHit extends ObjectWithObjectID {
  readonly name?: string;
}

export default class SubjectSelect extends React.Component<SubjectSelectProps> {
  public readonly state: SubjectSelectState;
  private suggestionsTimeoutID?: number;

  private static searchIndex = client.initIndex('subjects');

  public constructor(props: SubjectSelectProps) {
    super(props);
    this.state = {
      suggestionsOpen: false,
      suggestions: [],
      subjects: {},
      inputValueWorkaround: '',
    };
    if (props.val) {
      props.val.forEach((s) => (this.state.subjects[s] = true));
      this.state.inputValueWorkaround = this.getInputValue();
    }
    this.openSuggestions = this.openSuggestions.bind(this);
    this.closeSuggestions = this.closeSuggestions.bind(this);
    this.updateInputValue = this.updateInputValue.bind(this);
  }

  /**
   * We can't call `updateSuggestions` in the constructor because we're not
   * allowed to `setState` until **after** the component is mounted.
   */
  public componentDidMount(): void {
    this.updateSuggestions();
  }

  /**
   * Ensure that the input value workaround always works (even when this input's
   * value is being controlled by a parent component).
   */
  public componentDidUpdate(): void {
    const val: string = this.getInputValue();
    if (this.props.val && val !== this.state.inputValueWorkaround)
      this.setState({ inputValueWorkaround: val });
  }

  /**
   * Updates the suggestions shown in the select below the subjects input based
   * on the results of the user's current input to an Algolia search query.
   * @todo Add React `ErrorBoundries` and otherwise catch possible errors here.
   * @see {@link https://www.algolia.com/doc/api-reference/api-methods/search/}
   */
  private async updateSuggestions(query: string = ''): Promise<void> {
    const res = await SubjectSelect.searchIndex.search(query);
    this.setState({
      suggestions: res.hits.map((subject: SubjectHit) => subject.name),
    });
  }

  /**
   * We use `setTimeout` and `clearTimeout` to wait a "tick" on a blur event
   * before toggling. Waiting ensures that the user hasn't clicked on the
   * subject select menu (and thus called `this.openSuggestions`).
   * @see {@link https://bit.ly/2x9eM27}
   */
  private closeSuggestions(): void {
    this.suggestionsTimeoutID = window.setTimeout(() => {
      if (this.state.suggestionsOpen) this.setState({ suggestionsOpen: false });
    }, 0);
  }

  /**
   * We clear the timeout set by `this.closeSuggestions` to ensure that they
   * user doesn't get a blip where the subject select menu disappears and
   * reappears abruptly.
   * @see {@link https://bit.ly/2x9eM27}
   */
  private openSuggestions(): void {
    window.clearTimeout(this.suggestionsTimeoutID);
    if (!this.state.suggestionsOpen) this.setState({ suggestionsOpen: true });
  }

  /**
   * Workaround for styling the input as if it has content. If there are
   * subjects selected (in the given `subjects` object), this will return a
   * string containing a space (`' '`) so that the `TextField` styles itself as
   * if it were filled.
   * @todo Ideally, remove this workaround. But instead, make the `&nsbp;`
   * actually show up as a non-breaking space (i.e. nothing).
   * @see {@link https://github.com/jamesmfriedman/rmwc/issues/601}
   * @return {string} The input value (either `' '` or `''`).
   */
  private getInputValue(subjects: SubjectsAlias = this.state.subjects): string {
    const selected: boolean = Object.values(subjects).reduce(
      (a, b) => a || b,
      false
    );
    return selected ? '\xa0' : '';
  }

  /**
   * Workaround for styling the input as if it has content. If there are
   * subjects selected (in the given `subjects` object) and the `TextField`
   * would otherwise be empty, this will update the current input's value to a
   * string containing a space (`' '`) so that the `TextField` styles itself as
   * if it were filled. Otherwise, this acts as it normally would by updating
   * the `TextField`'s value using `setState`.
   * @see {@link https://github.com/jamesmfriedman/rmwc/issues/601}
   */
  private updateInputValue(event: React.FormEvent<HTMLInputElement>): void {
    const value: string = event.currentTarget.value || this.getInputValue();
    this.setState({ inputValueWorkaround: value });
    this.updateSuggestions(event.currentTarget.value);
  }

  public render(): JSX.Element {
    const { className, onChange, ...rest } = this.props;
    return (
      <MenuSurfaceAnchor className={className}>
        <MenuSurface
          open={this.state.suggestionsOpen}
          onFocus={this.openSuggestions}
          onBlur={this.closeSuggestions}
          anchorCorner='bottomStart'
        >
          <List>{this.renderSubjectMenuItems()}</List>
        </MenuSurface>
        <TextField
          {...rest}
          textarea
          value={this.state.inputValueWorkaround}
          onFocus={this.openSuggestions}
          onBlur={this.closeSuggestions}
          onChange={this.updateInputValue}
          className={styles.textField}
        >
          {this.renderSubjectChipItems()}
        </TextField>
      </MenuSurfaceAnchor>
    );
  }

  /**
   * Selects or un-selects the given subject string by setting it's value in
   * `this.state.subjects` to `true` which:
   * 1. Checks it's corresponding `mdc-checkbox` within our drop-down menu.
   * 2. Adding it as a chip to the `mdc-text-field` content.
   */
  private updateSubject(subject: string): void {
    const subjects: SubjectsAlias = {
      ...this.state.subjects,
      [subject]: !this.state.subjects[subject],
    };
    const value: string =
      this.state.inputValueWorkaround || this.getInputValue(subjects);
    this.setState({
      subjects: subjects,
      inputValueWorkaround: value,
    });
    const selected: string[] = Object.entries(subjects)
      .filter(([_, isSelected]) => isSelected)
      .map(([subject, _]) => subject);
    this.props.onChange(selected);
  }

  private renderSubjectMenuItems(): JSX.Element[] {
    const subjectMenuItems: JSX.Element[] = [];
    this.state.suggestions.map((subject) =>
      subjectMenuItems.push(
        <ListItem
          key={subject}
          onClick={() => this.updateSubject(subject)}
          className={styles.menuItem}
        >
          <ListItemGraphic
            icon={<Checkbox checked={this.state.subjects[subject]} readOnly />}
          />
          {subject}
        </ListItem>
      )
    );
    return subjectMenuItems;
  }

  private renderSubjectChipItems(): JSX.Element[] {
    const subjectChipItems: JSX.Element[] = [];
    Object.entries(this.state.subjects).map(([subject, isSelected]) => {
      if (isSelected)
        subjectChipItems.push(
          <Chip
            key={subject}
            label={subject}
            trailingIcon='close'
            onTrailingIconInteraction={() => this.updateSubject(subject)}
            className={styles.chip}
          ></Chip>
        );
    });
    return subjectChipItems;
  }
}
