import { memo, useCallback, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { dequal } from 'dequal/lite';
import { v4 as uuid } from 'uuid';

import DialogContent from 'components/dialog';

import { User, UserJSON } from 'lib/model';

import DisplayPage from './display-page';
import EditPage from './edit-page';
import MatchPage from './match-page';

export enum Page {
  Display = 0,
  Edit,
  Match,
}

export interface UserDialogContentProps {
  initialData?: UserJSON;
  initialPage?: Page;
  closeDialog: () => void;
}

// This wrapper component merely manages the navigation transitions between it's
// children. The default visible page is the `DisplayPage` but that can be
// configured via the `page` prop.
export default memo(
  function UserDialogContent({
    initialData = new User().toJSON(),
    initialPage = Page.Display,
    closeDialog,
  }: UserDialogContentProps): JSX.Element {
    // Temporary ID that is used to locally mutate SWR data (without calling API).
    // We have to use a stateful variable for our ID to support user creation.
    // @see {@link https://github.com/vercel/swr/issues/576}
    if (!initialData.id) initialData.id = `temp-${uuid()}`;
    const [id, setId] = useState<string>(initialData.id);
    const { data } = useSWR<UserJSON>(`/api/users/${id}`, {
      initialData,
      revalidateOnMount: true,
    });
    const user = data as UserJSON;

    const onChange = useCallback(async (updated: UserJSON) => {
      setId(updated.id);
      await mutate(`/api/users/${updated.id}`, updated, false);
    }, []);

    const [active, setActive] = useState<number>(initialPage);
    const [loading, setLoading] = useState<boolean>(false);
    const [checked, setChecked] = useState<boolean>(false);

    const openDisplay = useCallback(() => setActive(Page.Display), []);
    const openEdit = useCallback(() => setActive(Page.Edit), []);
    const openMatch = useCallback(() => setActive(Page.Match), []);

    return (
      <DialogContent
        active={active}
        setActive={setActive}
        loading={loading}
        checked={checked}
      >
        <DisplayPage
          value={user}
          openEdit={openEdit}
          openMatch={openMatch}
          closeDialog={closeDialog}
          setLoading={setLoading}
          setChecked={setChecked}
          onChange={onChange}
        />
        <EditPage
          value={user}
          setLoading={setLoading}
          setChecked={setChecked}
          onChange={onChange}
          openDisplay={openDisplay}
        />
        <MatchPage
          value={user}
          loading={loading}
          setLoading={setLoading}
          setChecked={setChecked}
          openDisplay={openDisplay}
        />
      </DialogContent>
    );
  },
  (prevProps: UserDialogContentProps, nextProps: UserDialogContentProps) => {
    return dequal(
      {
        data: prevProps.initialData,
        page: prevProps.initialPage,
      },
      {
        data: nextProps.initialData,
        page: nextProps.initialPage,
      }
    );
  }
);
