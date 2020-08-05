import { Callback } from 'lib/model';

export type InputsConfig<Input extends string | number | symbol> = {
  [key in Input]?: boolean;
};

/**
 * Each abstract `Inputs` component is fully configurable and controlled.
 * @param value - The current data model state.
 * @param onChange - Callback when the data model state changes.
 * @param [focused] - The input to focus automatically first (e.g. when clicking
 * a button on a filter form opens this input set to a certain input).
 * @param [thirdPerson] - Whether to use third person labels instead of the
 * default neutral labels (i.e. 'Your name' v.s. 'Name').
 * @param [renderToPortal] - Whether or not to render the input menus to the
 * `#portal` div. Note that setting this to `true` will mess up focus capturing
 * and event bubbling (but it is recommended to do so in dialogs and such).
 * @param [className] - Custom class name to apply to all the inputs.
 */
export interface InputsProps<
  T extends Record<string, any>,
  Input extends string | number | symbol
> {
  value: T;
  onChange: Callback<T>;
  focused?: Input;
  thirdPerson?: boolean;
  renderToPortal?: boolean;
  className?: string;
}
