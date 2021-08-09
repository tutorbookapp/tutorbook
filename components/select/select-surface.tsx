import { List, ListItem, ListItemGraphic } from '@rmwc/list';
import { MouseEvent, memo } from 'react';
import { Checkbox } from '@rmwc/checkbox';
import { dequal } from 'dequal/lite';
import { nanoid } from 'nanoid';

import AddIcon from 'components/icons/add';

import { Option } from 'lib/model/query/base';

import styles from './select.module.scss';

// TODO: Debug why the `updateSelected` type doesn't work with `Select`.
export interface SelectSurfaceProps<T, O extends Option<T> = Option<T>> {
  suggestions: O[];
  noResultsMessage: string;
  updateSelected: (option: any, event?: MouseEvent) => void;
  errored: boolean;
  value: O[];
  create?: string;
  onCreate?: () => void;
}

function SelectSurface<T, O extends Option<T>>({
  suggestions,
  noResultsMessage,
  updateSelected,
  errored,
  value,
  create,
  onCreate,
}: SelectSurfaceProps<T, O>): JSX.Element {
  return (
    <List>
      {!suggestions.length && !create && (
        <div className={styles.noResults}>
          {errored ? 'Errored, try again' : noResultsMessage}
        </div>
      )}
      {suggestions.map((opt) => (
        <ListItem
          key={opt.key || nanoid()}
          onClick={(evt: MouseEvent) => updateSelected(opt, evt)}
          className={styles.menuItem}
        >
          <ListItemGraphic
            icon={
              <Checkbox
                checked={value.some((s) => s.value === opt.value)}
                readOnly
              />
            }
          />
          {opt.label}
        </ListItem>
      ))}
      {create && (
        <ListItem onClick={onCreate} className={styles.menuItem}>
          <ListItemGraphic icon={<AddIcon />} />
          {create}
        </ListItem>
      )}
    </List>
  );
}

export default memo(SelectSurface, dequal);
