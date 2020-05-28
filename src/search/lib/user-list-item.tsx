import {
  ListItem,
  ListItemGraphic,
  ListItemText,
  ListItemPrimaryText,
  ListItemSecondaryText,
} from '@rmwc/list';
import { Avatar } from '@rmwc/avatar';
import { User } from '@tutorbook/model';

interface Props {
  user: User;
  onClick: (event: React.SyntheticEvent<HTMLElement>) => any;
}

export default function UserListItem({ user, onClick }: Props): JSX.Element {
  return (
    <ListItem>
      <ListItemGraphic
        icon={<Avatar src={user.photo} size='xsmall' name={user.name} />}
      />
      <ListItemText>
        <ListItemPrimaryText>{user.name}</ListItemPrimaryText>
        <ListItemSecondaryText>{user.bio}</ListItemSecondaryText>
      </ListItemText>
    </ListItem>
  );
}
