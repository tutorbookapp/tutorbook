import React from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { useIntl, IntlShape } from 'react-intl';

// TODO: Why is this necessary? Shouldn't `NextLinkProps` already accept a
// `children` property? Or is there some sort of implied type intersection when
// components are defined as classes v.s. functions in React?
interface LinkProps extends NextLinkProps {
  children?: JSX.Element | JSX.Element[];
}

export function Link(props: LinkProps): JSX.Element {
  const intl: IntlShape = useIntl();
  const { href, ...rest } = props;
  const withLocaleHref: string = `/${intl.locale}${href}`.replace(/\/$/, '');
  return <NextLink href={withLocaleHref} {...rest} />;
}
