import Link from 'next/link';
import {
  useIntl,
  IntlShape,
  defineMessages,
  MessageDescriptor,
} from 'react-intl';

import MobileNav from './mobile';
import DesktopNav from './desktop';

import styles from './covid-header.module.scss';

export interface NavProps {
  white?: boolean;
  links: LinkProps[];
}

export interface LinkProps {
  href: string;
  label: string;
}

interface NavLinkProps extends LinkProps {
  menuItemLinkClassName: string;
}

interface NavItemProps extends NavLinkProps {
  menuItemClassName: string;
}

export function NavItem(props: NavItemProps): JSX.Element {
  const { menuItemClassName, ...rest } = props;
  return (
    <li className={menuItemClassName}>
      <NavLink {...rest} />
    </li>
  );
}

function NavLink(props: NavLinkProps): JSX.Element {
  if (props.href.indexOf('http') < 0)
    return (
      <Link href={props.href}>
        <a className={props.menuItemLinkClassName}>{props.label}</a>
      </Link>
    );
  return (
    <a className={props.menuItemLinkClassName} href={props.href}>
      {props.label}
    </a>
  );
}

interface HeaderProps {
  white?: boolean;
  sticky?: boolean;
  className?: string;
}

export default function Header(props: HeaderProps): JSX.Element {
  const intl: IntlShape = useIntl();
  const { white, sticky, className } = props;
  const labels: Record<string, MessageDescriptor> = defineMessages({
    pupils: {
      id: 'header.pupils',
      defaultMessage: 'For students',
      description: 'Label for the pupil sign-up page header link.',
    },
    tutors: {
      id: 'header.tutors',
      defaultMessage: 'For volunteers',
      description: 'Label for the tutor sign-up page header link.',
    },
    developers: {
      id: 'header.developers',
      defaultMessage: 'For developers',
      description: 'Label for the developers page header link.',
    },
  });
  const links: LinkProps[] = [
    {
      href: '/pupils/',
      label: intl.formatMessage(labels.pupils),
    },
    {
      href: '/tutors/',
      label: intl.formatMessage(labels.tutors),
    },
    {
      href: 'https://github.com/tutorbookapp/covid-tutoring#readme',
      label: intl.formatMessage(labels.developers),
    },
  ];
  return (
    <header
      style={{
        position: sticky ? 'sticky' : 'initial',
      }}
      className={
        styles.header +
        ' ' +
        (white ? styles.whiteHeader : styles.blackHeader) +
        (className ? ' ' + className : '')
      }
    >
      <MobileNav white={!!white} links={links} />
      <DesktopNav white={!!white} links={links} />
    </header>
  );
}
