import React from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import useTranslation from 'next-translate/useTranslation';

// TODO: Why is this necessary? Shouldn't `NextLinkProps` already accept a
// `children` property? Or is there some sort of implied type intersection when
// components are defined as classes v.s. functions in React?
interface LinkProps extends NextLinkProps {
  children?: JSX.Element | JSX.Element[];
}

export default function Link({ href, as, ...rest }: LinkProps): JSX.Element {
  const { lang: locale } = useTranslation();
  const fixedAs = `/${locale}${(as || href).toString()}`.replace(/\/$/, '');
  const fixedHref = `/[locale]${href.toString()}`.replace(/\/$/, '');
  return <NextLink href={fixedHref} as={fixedAs} {...rest} />;
}
