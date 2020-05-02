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
    options: [
      {
        label: 'Senior',
        value: '12',
      },
      {
        label: 'Junior',
        value: '11',
      },
      {
        label: 'Sophomore',
        value: '10',
      },
      {
        label: 'Freshman',
        value: '9',
      },
    ],
  },
  {
    label: null,
    options: [
      {
        label: '8th Grade',
        value: '8',
      },
      {
        label: '7th Grade',
        value: '7',
      },
      {
        label: '6th Grade',
        value: '6',
      },
    ],
  },
  {
    label: null,
    options: [
      {
        label: '5th Grade',
        value: '5',
      },
      {
        label: '4th Grade',
        value: '4',
      },
      {
        label: '3rd Grade',
        value: '3',
      },
      {
        label: '2nd Grade',
        value: '2',
      },
      {
        label: '1st Grade',
        value: '1',
      },
      {
        label: 'Kindergarten',
        value: '0',
      },
    ],
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
