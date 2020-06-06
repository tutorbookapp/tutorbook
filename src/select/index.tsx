import React from 'react';
import { Typography } from '@rmwc/typography';
import { List, ListItem, ListItemGraphic } from '@rmwc/list';
import { MenuSurfaceAnchor, MenuSurface } from '@rmwc/menu';
import { TextField, TextFieldProps, TextFieldHTMLProps } from '@rmwc/textfield';
import { Chip } from '@rmwc/chip';
import { Checkbox } from '@rmwc/checkbox';
import { SelectHint } from './select-hint';

import to from 'await-to-js';
import styles from './select.module.scss';

interface SelectState {
  suggestionsOpen: boolean;
  suggestions: string[];
  selected: string[];
  errored: boolean;
  inputValue: string;
  inputFocused: boolean;
  lineBreak: boolean;
}

interface UniqueSelectProps extends TextFieldProps {
  onChange?: (selected: string[]) => any;
  className?: string;
  val?: string[];
  renderToPortal?: boolean;
  autoOpenMenu?: boolean;
  getSuggestions: (query: string) => Promise<string[]>;
}

export type SelectProps = UniqueSelectProps &
  Omit<TextFieldHTMLProps, 'onChange' | 'ref'>;

export default class Select extends React.Component<SelectProps> {
  public readonly state: SelectState;

  private suggestionsTimeoutID?: ReturnType<typeof setTimeout>;

  private foundationRef: any;

  private inputRef: React.RefObject<HTMLInputElement>;

  private ghostElementRef: React.RefObject<HTMLSpanElement>;

  private lastSelectedRef: React.MutableRefObject<string | null>;

  private textareaBreakWidth: React.MutableRefObject<number | null>;

  private hasOpenedSuggestions: boolean = false;

  public constructor(props: SelectProps) {
    super(props);
    this.state = {
      suggestionsOpen: false,
      suggestions: [],
      selected: props.val || [],
      errored: false,
      inputValue: '',
      inputFocused: false,
      lineBreak: false,
    };
    this.inputRef = React.createRef();
    this.lastSelectedRef = React.createRef();
    this.ghostElementRef = React.createRef();
    this.textareaBreakWidth = React.createRef();
    this.maybeOpenSuggestions = this.maybeOpenSuggestions.bind(this);
    this.openSuggestions = this.openSuggestions.bind(this);
    this.closeSuggestions = this.closeSuggestions.bind(this);
    this.updateInputValue = this.updateInputValue.bind(this);
    this.updateInputLine = this.updateInputLine.bind(this);
  }

  /**
   * We can't call `updateSuggestions` in the constructor because we're not
   * allowed to `setState` until **after** the component is mounted.
   */
  public componentDidMount(): void {
    this.updateSuggestions();
  }

  private async updateSuggestions(query: string = ''): Promise<void> {
    const [err, options] = await to<string[]>(this.props.getSuggestions(query));
    if (err) {
      this.setState({ suggestions: [], errored: true });
    } else {
      this.setState({ suggestions: options, errored: false });
    }
  }

  /**
   * Make sure to update the "above-the-fold" options based on the given grade
   * level.
   * @see {@link https://github.com/tutorbookapp/covid-tutoring/issues/20#issuecomment-630958982}
   *
   * Note that this also contains a painful workaround to ensure that the select
   * menu is positioned correctly **even** if it's anchor (the `TextField`)
   * changes shape.
   * @see {@link https://github.com/jamesmfriedman/rmwc/issues/611}
   */
  public componentDidUpdate(prevProps: SelectProps): void {
    const shouldChangeInputValue: boolean =
      (this.state.inputValue === '' || this.state.inputValue === '\xa0') &&
      this.inputValue !== this.state.inputValue;
    const valChanged = prevProps.val !== this.props.val;
    if (shouldChangeInputValue) this.setState({ inputValue: this.inputValue });
    if (valChanged && this.props.val)
      this.setState({ selected: this.props.val });
    if (prevProps.getSuggestions !== this.props.getSuggestions)
      this.updateSuggestions();
    if (this.foundationRef) this.foundationRef.autoPosition_();
  }

  /**
   * We clear the timeout set by `this.closeSuggestions` to ensure that the
   * user doesn't get a blip where the suggestion select menu disappears and
   * reappears abruptly.
   * @see {@link https://bit.ly/2x9eM27}
   */
  private openSuggestions(): void {
    if (this.suggestionsTimeoutID) clearTimeout(this.suggestionsTimeoutID);
    if (!this.state.suggestionsOpen) {
      this.hasOpenedSuggestions = true;
      this.setState({ suggestionsOpen: true });
    }
  }

  private closeSuggestions(): void {
    this.suggestionsTimeoutID = setTimeout(() => {
      if (this.state.suggestionsOpen) {
        this.setState({ suggestionsOpen: false });
        this.lastSelectedRef.current = null;
      }
    }, 0);
  }

  /**
   * The `TextField`'s label should float if any of the following is true:
   * - The `TextField`'s value isn't empty.
   * - The `TextField` is focused.
   * - There are options selected (this is the only thing that's custom).
   */
  private get inputValue(): string {
    return this.optionsAreSelected ? '\xa0' : '';
  }
  /*
   *private get labelShouldFloat(): boolean {
   *  return (
   *    this.state.inputValue !== '' ||
   *    this.state.inputFocused ||
   *    this.optionsAreSelected
   *  );
   *}
   */

  /**
   * Make sure to float the `TextField`'s label if there are options selected.
   * @see {@link https://github.com/jamesmfriedman/rmwc/issues/601}
   * @see {@link https://github.com/tutorbookapp/covid-tutoring/issues/8}
   */
  private get optionsAreSelected(): boolean {
    return this.state.selected.length > 0;
  }

  /**
   * Workaround for styling the input as if it has content. If there are
   * options selected (in the given `options` object) and the `TextField`
   * would otherwise be empty, this will update the current input's value to a
   * string containing a space (`' '`) so that the `TextField` styles itself as
   * if it were filled. Otherwise, this acts as it normally would by updating
   * the `TextField`'s value using `setState`.
   * @see {@link https://github.com/jamesmfriedman/rmwc/issues/601}
   */
  private updateInputValue(event: React.FormEvent<HTMLInputElement>): void {
    const inputValue: string = event.currentTarget.value || this.inputValue;
    this.updateInputLine(event);
    this.setState({ inputValue });
    this.updateSuggestions(event.currentTarget.value);
    this.openSuggestions();
  }

  /**
   * We don't show the suggestion menu until after the user has started typing.
   * That way, the user learns that they can type to filter/search the options.
   * After they learn that (i.e. after the menu has been opened at least once),
   * we revert back to the original behavior (i.e. opening the menu whenever the
   * `TextField` input is focused).
   */
  private maybeOpenSuggestions(): void {
    if (this.props.autoOpenMenu || this.hasOpenedSuggestions)
      this.openSuggestions();
  }

  /**
   * This function pushes `<textarea>` to the next line when it's width is less
   * than the width of its text content.
   *
   * To measure the width of the content, the width of the invisible `<span>` is
   * used (to which the value of `<textarea>` is then assigned).
   */
  private updateInputLine(event: React.FormEvent<HTMLInputElement>): void {
    if (this.ghostElementRef.current) {
      this.ghostElementRef.current.innerText = event.currentTarget.value;

      if (
        this.ghostElementRef.current.clientWidth >
        event.currentTarget.clientWidth
      ) {
        this.textareaBreakWidth.current = event.currentTarget.clientWidth;
        this.setState({ lineBreak: true });
        return;
      }

      if (
        this.textareaBreakWidth.current &&
        this.ghostElementRef.current.clientWidth <=
          this.textareaBreakWidth.current
      ) {
        this.textareaBreakWidth.current = null;
        this.setState({ lineBreak: false });
      }
    }
  }

  /**
   * @todo Allow the user to interact with the static content of the menu (i.e.
   * the text that doesn't cause an `onFocus` event when clicked). Right now,
   * interacting with such static content within the menu causes the menu to
   * lose focus which makes us close it.
   */
  public render(): JSX.Element {
    const {
      onChange,
      className,
      val,
      renderToPortal,
      options,
      grade,
      searchIndex,
      autoOpenMenu,
      ...rest
    } = this.props;
    return (
      <MenuSurfaceAnchor className={className}>
        <MenuSurface
          foundationRef={(ref: any) => (this.foundationRef = ref)}
          open={this.state.suggestionsOpen}
          onFocus={(event: React.SyntheticEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            if (this.inputRef.current) this.inputRef.current.focus();
          }}
          anchorCorner='bottomStart'
          renderToPortal={renderToPortal ? '#portal' : false}
          className={!this.state.suggestions.length ? styles.errMenu : ''}
        >
          <List>{this.renderSuggestionMenuItems()}</List>
        </MenuSurface>
        <SelectHint open={this.state.suggestionsOpen}>
          <TextField
            {...rest}
            textarea
            ref={this.inputRef}
            value={this.state.inputValue}
            onFocus={() => {
              this.setState({ inputFocused: true });
              this.maybeOpenSuggestions();
            }}
            onBlur={() => {
              this.setState({ inputFocused: false });
              this.closeSuggestions();
            }}
            onChange={this.updateInputValue}
            className={styles.textField}
          >
            {this.renderSelectedChipItems()}
            {this.state.lineBreak && <div className={styles.lineBreak}></div>}
            <span ref={this.ghostElementRef} className={styles.ghost}></span>
          </TextField>
        </SelectHint>
      </MenuSurfaceAnchor>
    );
  }

  /**
   * Selects or un-selects the given option string by setting it's value in
   * `this.state.selected` to `true` which:
   * 1. Checks it's corresponding `mdc-checkbox` within our drop-down menu.
   * 2. Adding it as a chip to the `mdc-text-field` content.
   */
  private updateSelected(option: string, event?: React.MouseEvent): void {
    const selected: string[] = Array.from(this.state.selected);
    const selectedIndex: number = selected.indexOf(option);
    if (selectedIndex < 0) {
      selected.push(option);
    } else {
      selected.splice(selectedIndex, 1);
    }

    if (
      this.state.suggestions.length &&
      this.lastSelectedRef.current &&
      event?.shiftKey
    ) {
      // Select/unselect multiple options with 'SHIFT + click'
      const { suggestions } = this.state;
      const idx: number = suggestions.indexOf(option);
      const idxOfLast: number = suggestions.indexOf(
        this.lastSelectedRef.current
      );
      suggestions
        .slice(Math.min(idx, idxOfLast), Math.max(idx, idxOfLast) + 1)
        .forEach((option: string) => {
          const index: number = selected.indexOf(option);
          if (selectedIndex < 0 && index < 0) {
            selected.push(option);
          } else if (selectedIndex >= 0 && index >= 0) {
            selected.splice(index, 1);
          }
        });
    }

    this.lastSelectedRef.current = option;

    const inputValue: string = selectedIndex < 0 ? '' : this.state.inputValue;
    this.setState({ selected, inputValue, lineBreak: false });
    this.props.onChange && this.props.onChange(selected);
  }

  private renderSuggestionMenuItems(): JSX.Element[] | JSX.Element {
    const noResults: JSX.Element = (
      <Typography use='body1' className={styles.noResults}>
        {this.state.errored ? 'Errored, try again' : 'No results'}
      </Typography>
    );
    const suggestionMenuItems: JSX.Element[] = [];
    this.state.suggestions.map((option) =>
      suggestionMenuItems.push(
        <ListItem
          key={option}
          onClick={(event: React.MouseEvent) =>
            this.updateSelected(option, event)
          }
          className={styles.menuItem}
        >
          <ListItemGraphic
            icon={
              <Checkbox
                checked={this.state.selected.indexOf(option) >= 0}
                readOnly
              />
            }
          />
          {option}
        </ListItem>
      )
    );
    return suggestionMenuItems.length ? suggestionMenuItems : noResults;
  }

  private renderSelectedChipItems(): JSX.Element[] {
    return this.state.selected.map((option: string) => (
      <Chip
        key={option}
        label={option}
        trailingIcon='close'
        onTrailingIconInteraction={() => this.updateSelected(option)}
        className={styles.chip}
      />
    ));
  }
}
