import { useEffect } from 'react';

export default function usePage(name: string): void {
  useEffect(() => {
    console.log(`[PAGE] ${name}`);
    window.analytics.page(name);
  }, [name]);
}
