import Router from 'next/router';
import { dequal } from 'dequal';
import { useEffect } from 'react';

import { Callback } from 'lib/model/callback';
import { Query } from 'lib/model/query/base';

interface Constructor<T extends Query> {
  fromURLParams: (params: any) => T;
}

// Syncs the initial query state in URL parameters. This gives users a sharable
// link that contains their query state (e.g. I can share a link showing all the
// Songwriting teachers with another org admin).
// TODO: Perhaps look into directly managing state using the Next.js router.
export default function useURLParamSync<T extends Query>(
  query: T,
  setQuery: Callback<T>,
  Model: Constructor<T>
): void {
  useEffect(() => {
    setQuery((prev) => {
      if (typeof window === 'undefined') return prev;
      const params = new URLSearchParams(window.location.search);
      const updated = Model.fromURLParams({
        ...prev.getURLParams(),
        ...Object.fromEntries(params.entries()),
      });
      if (dequal(prev, updated)) return prev;
      return updated;
    });
  }, [setQuery, Model]);

  // TODO: Don't include query params that are specified in other ways (e.g. the
  // users dashboard specifies org in the `[org]` dynamic page param).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = query.getURL(window.location.pathname);
    void Router.replace(url, undefined, { shallow: true });
  }, [query]);
}