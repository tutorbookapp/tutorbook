import React from 'react';
import { Typography } from '@rmwc/typography';
import { List, ListItem, ListItemGraphic } from '@rmwc/list';
import { MenuSurfaceAnchor, MenuSurface } from '@rmwc/menu';
import { TextField, TextFieldProps } from '@rmwc/textfield';
import { Chip } from '@rmwc/chip';
import { Checkbox } from '@rmwc/checkbox';
import { SearchClient, SearchIndex } from 'algoliasearch/lite';
import { GradeAlias } from '@tutorbook/model';
import {
  SearchOptions,
  SearchResponse,
  ObjectWithObjectID,
} from '@algolia/client-search';
import { SelectHint } from './select-hint';

import to from 'await-to-js';
import algoliasearch from 'algoliasearch/lite';
import styles from './subject-select.module.scss';

const algoliaId: string = process.env.ALGOLIA_SEARCH_ID as string;
const algoliaKey: string = process.env.ALGOLIA_SEARCH_KEY as string;

const client: SearchClient = algoliasearch(algoliaId, algoliaKey);

type SubjectsAlias = { [subject: string]: boolean };

interface SubjectSelectState {
  readonly suggestionsOpen: boolean;
  readonly suggestions: string[];
  readonly subjects: SubjectsAlias;
  readonly errored: boolean;
  inputValueWorkaround: string;
  lineBreak: boolean;
}

export interface SubjectSelectProps extends TextFieldProps {
  readonly onChange: (subjects: string[]) => any;
  readonly className?: string;
  readonly val?: string[];
  readonly renderToPortal?: boolean;
  readonly options?: string[];
  readonly grade?: GradeAlias;
}

interface SubjectHit extends ObjectWithObjectID {
  readonly name?: string;
}

export default class SubjectSelect extends React.Component<SubjectSelectProps> {
  public readonly state: SubjectSelectState;
  private suggestionsTimeoutID?: number;
  private foundationRef: any;
  private lastSelectedRef: React.MutableRefObject<string | null>;
  private ghostElementRef: React.RefObject<HTMLSpanElement>;
  private textareaBreakWidth: React.MutableRefObject<number | null>;
  private static searchIndex: SearchIndex = client.initIndex('subjects');

  public constructor(props: SubjectSelectProps) {
    super(props);
    this.state = {
      suggestionsOpen: false,
      suggestions: [],
      subjects: {},
      errored: false,
      inputValueWorkaround: '',
      lineBreak: false,
    };
    if (props.val) {
      props.val.forEach((s) => (this.state.subjects[s] = true));
      this.state.inputValueWorkaround = this.getInputValue();
    }
    this.lastSelectedRef = React.createRef();
    this.ghostElementRef = React.createRef();
    this.textareaBreakWidth = React.createRef();
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
   *
   * Note that this also contains a painful workaround to ensure that the select
   * menu is positioned correctly **even** if it's anchor (the `TextField`)
   * changes shape.
   * @see {@link https://github.com/jamesmfriedman/rmwc/issues/611}
   */
  public componentDidUpdate(prevProps: SubjectSelectProps): void {
    const inputValueWorkaround: string = this.getInputValue();
    const shouldChangeValue: boolean =
      (this.state.inputValueWorkaround === '' ||
        this.state.inputValueWorkaround === '\xa0') &&
      inputValueWorkaround !== this.state.inputValueWorkaround;
    if (shouldChangeValue) this.setState({ inputValueWorkaround });
    if (prevProps.grade !== this.props.grade) this.updateSuggestions();
    this.foundationRef && this.foundationRef.autoPosition_();
  }

  /**
   * Updates the suggestions shown in the select below the subjects input based
   * on the results of the user's current input to an Algolia search query.
   * @see {@link https://www.algolia.com/doc/api-reference/api-methods/search/}
   */
  private async updateSuggestions(query: string = ''): Promise<void> {
    if (this.props.options && !this.props.options.length) {
      this.setState({ suggestions: [], errored: false });
    } else {
      const filters: string | undefined =
        this.props.options !== undefined
          ? this.props.options
              .map((subject: string) => `name:"${subject}"`)
              .join(' OR ')
          : undefined;
      const optionalFilters: string[] | undefined =
        this.props.grade !== undefined
          ? [`grades:${this.props.grade}`]
          : undefined;
      const options: SearchOptions = { filters, optionalFilters };
      const [err, res] = await to<SearchResponse<SubjectHit>>(
        SubjectSelect.searchIndex.search(query, options) as Promise<
          SearchResponse<SubjectHit>
        >
      );
      if (err) {
        this.setState({ suggestions: [], errored: true });
      } else {
        this.setState({
          suggestions: (res as SearchResponse<SubjectHit>).hits.map(
            (subject: SubjectHit) => subject.name
          ),
          errored: false,
        });
      }
    }
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
   * We use `setTimeout` and `clearTimeout` to wait a "tick" on a blur event
   * before toggling. Waiting ensures that the user hasn't clicked on the
   * subject select menu (and thus called `this.openSuggestions`).
   * @see {@link https://bit.ly/2x9eM27}
   */
  private closeSuggestions(): void {
    this.suggestionsTimeoutID = window.setTimeout(() => {
      if (this.state.suggestionsOpen) {
        this.setState({ suggestionsOpen: false });
        this.lastSelectedRef.current = null;
      }
    }, 0);
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

  /**
   * The function pushes <textarea> to the next line
   * when its width is less than the width of its text content.
   * To measure the width of the content the width of invisible <span> is used,
   * to which the value of <textarea> is assigned.
   */
  private changeTextareaLine = (
    event: React.FormEvent<HTMLInputElement>
  ): void => {
    if (this.ghostElementRef.current) {
      this.ghostElementRef.current.innerText = event.currentTarget.value;

      if (
        this.ghostElementRef.current.clientWidth >
        event.currentTarget.clientWidth
      ) {
        this.textareaBreakWidth.current = event.currentTarget.clientWidth;
        this.setState(() => ({
          lineBreak: true,
        }));
        return;
      }

      if (
        this.textareaBreakWidth.current &&
        this.ghostElementRef.current.clientWidth <=
          this.textareaBreakWidth.current
      ) {
        this.textareaBreakWidth.current = null;
        this.setState(() => ({
          lineBreak: false,
        }));
      }
    }
  };

  /**
   * @todo Allow the user to interact with the static content of the menu (i.e.
   * the text that doesn't cause an `onFocus` event when clicked). Right now,
   * interacting with such static content within the menu causes the menu to
   * lose focus which makes us close it.
   */
  public render(): JSX.Element {
    const { renderToPortal, className, onChange, ...rest } = this.props;
    return (
      <MenuSurfaceAnchor className={className}>
        <MenuSurface
          foundationRef={(ref: any) => (this.foundationRef = ref)}
          open={this.state.suggestionsOpen}
          onFocus={this.openSuggestions}
          onBlur={this.closeSuggestions}
          anchorCorner='bottomStart'
          renderToPortal={renderToPortal ? '#portal' : false}
        >
          <List>{this.renderSubjectMenuItems()}</List>
        </MenuSurface>
        <SelectHint>
          <TextField
            {...rest}
            textarea
            maxLength={15}
            value={this.state.inputValueWorkaround}
            onFocus={this.openSuggestions}
            onBlur={this.closeSuggestions}
            onChange={this.updateInputValue}
            onKeyUp={this.changeTextareaLine}
            className={styles.textField}
          >
            {this.renderSubjectChipItems()}
            {this.state.lineBreak && <div className={styles.lineBreak}></div>}
            <span ref={this.ghostElementRef} className={styles.ghost}></span>
          </TextField>
        </SelectHint>
      </MenuSurfaceAnchor>
    );
  }

  /**
   * Selects or un-selects the given subject string by setting it's value in
   * `this.state.subjects` to `true` which:
   * 1. Checks it's corresponding `mdc-checkbox` within our drop-down menu.
   * 2. Adding it as a chip to the `mdc-text-field` content.
   */
  private updateSubject(subject: string, event?: React.MouseEvent): void {
    const subjects: SubjectsAlias = {
      ...this.state.subjects,
      [subject]: !this.state.subjects[subject],
    };

    if (
      this.state.suggestions.length &&
      this.lastSelectedRef.current &&
      event?.shiftKey
    ) {
      /* select/unselect multiple subjects
        with shift + click */
      const { suggestions } = this.state;
      const idx: number = suggestions.indexOf(subject);
      const idxOfLast: number = suggestions.indexOf(
        this.lastSelectedRef.current
      );
      suggestions
        .slice(Math.min(idx, idxOfLast), Math.max(idx, idxOfLast) + 1)
        .forEach((name) => {
          subjects[name] = !this.state.subjects[subject];
        });
    }

    this.lastSelectedRef.current = subject;

    this.setState(() => ({
      subjects: subjects,
      inputValueWorkaround: '',
      lineBreak: false,
    }));

    const selected: string[] = Object.entries(subjects)
      .filter(([_, isSelected]) => isSelected)
      .map(([subject, _]) => subject);
    this.props.onChange(selected);
  }

  private renderSubjectMenuItems(): JSX.Element[] | JSX.Element {
    const noResults: JSX.Element = (
      <Typography use='body1' className={styles.noResults}>
        {this.state.errored ? 'Errored, try again' : 'No results'}
      </Typography>
    );
    const subjectMenuItems: JSX.Element[] = [];
    this.state.suggestions.map((subject) =>
      subjectMenuItems.push(
        <ListItem
          key={subject}
          onClick={(event: React.MouseEvent) =>
            this.updateSubject(subject, event)
          }
          className={styles.menuItem}
        >
          <ListItemGraphic
            icon={<Checkbox checked={this.state.subjects[subject]} readOnly />}
          />
          {subject}
        </ListItem>
      )
    );
    return subjectMenuItems.length ? subjectMenuItems : noResults;
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
