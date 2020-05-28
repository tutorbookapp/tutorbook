import { List } from '@rmwc/list';

export default function UserList({
  children,
}: {
  children: JSX.Element[];
}): JSX.Element {
  return (
    <List twoLine avatarList>
      {children}
    </List>
  );
}
