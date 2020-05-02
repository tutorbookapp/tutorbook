import { FormattedOption } from '@rmwc/select';

/**
 * This object represents the options that the user can select for 'grade'. Note
 * that we're using a workaround to make them separate list groups (but this
 * workaround **still** results in the creation of `mdc-list-group__subheaders`
 * that we don't want).
 * @todo Remove this altogether and support multiple languages and ed systems.
 * @todo Remove the `mdc-list-group__subheaders` from the resulting `Menu`.
 * @see {@link https://github.com/jamesmfriedman/rmwc/issues/614}
 */
export const GRADES: FormattedOption[] = [
  {
    label: null,
    options: ['Senior', 'Junior', 'Sophomore', 'Freshman'].map((label) => ({
      value: label,
      label,
    })),
  },
  {
    label: null,
    options: ['8th Grade', '7th Grade', '6th Grade'].map((label) => ({
      value: label,
      label,
    })),
  },
  {
    label: null,
    options: [
      '5th Grade',
      '4th Grade',
      '3rd Grade',
      '2nd Grade',
      '1st Grade',
      'Kindergarten',
    ].map((label) => ({ label })),
  },
];

// TODO: Remove this and support multiple languages.
export const DAYS: Readonly<string[]> = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
