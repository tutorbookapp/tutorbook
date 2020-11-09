import { useCallback, useRef } from 'react';

import LockIcon from 'components/icons/lock';
import RefreshIcon from 'components/icons/refresh';

interface BrowserProps {
  url: string;
  refresh: () => void;
}

function Browser({ url, refresh }: BrowserProps): JSX.Element {
  return (
    <div className='bar'>
      <div className='spacer' />
      <div className='input'>
        <div className='url'>
          <i className='lock'>
            <LockIcon />
          </i>
          <a href={url}>{`tutorbook.app${url}`}</a>
          <button className='refresh' type='button' onClick={refresh}>
            <RefreshIcon />
          </button>
        </div>
      </div>
      <div className='spacer end' />
      <style jsx>{`
        .bar {
          flex: 1 1;
          color: var(--geist-foreground);
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .spacer {
          flex-basis: 140px;
          flex-shrink: 0;
        }

        .input {
          flex: 1 1;
          background: var(--accents-1);
          border-radius: 3px;
          height: 70%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0 var(--geist-gap-half);
          position: relative;
        }

        .url {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .url svg {
          vertical-align: middle;
        }

        .url-disabled,
        .url a {
          white-space: nowrap;
          line-height: 1.25rem;
          font-size: 0.75rem;
          flex: 1 1;
          margin: 0 var(--geist-gap-quarter);
          max-width: 100%;
          display: block;
          text-overflow: ellipsis;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
        }

        .lock {
          color: var(--geist-cyan-dark);
        }

        .lock-placeholder {
          display: inline-flex;
          width: 12px;
        }

        .bar i {
          display: inline-flex;
        }

        button.refresh {
          flex-shrink: 0;
          background: transparent;
          border: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          outline: 0;
          cursor: pointer;
          padding: 0;
        }

        @media (max-width: 600px) {
          .spacer {
            flex-basis: 80px;
          }

          .spacer.end {
            flex-basis: var(--geist-gap-half);
          }

          .input {
            flex: 1 1;
            overflow: hidden;
          }
        }
      `}</style>
    </div>
  );
}

// TODO: Remove this export (and remove this `Tabs` component altogether) or add
// props to `Window` that enable it's usage.
// @see {@link https://vercel.com/design/window#with-tabs}
export function Tabs(): JSX.Element {
  return (
    <div className='tabs'>
      <div className='tab'>index.js</div>
      <div className='tab active'>about.js</div>
      <style jsx>{`
        .tabs {
          display: flex;
          left: 80px;
          position: absolute;
          bottom: -1px;
        }

        .tab {
          display: inline-flex;
          padding: 10px 20px;
          border: 1px solid transparent;
        }

        .tab.active {
          border-top-left-radius: var(--geist-radius);
          border-top-right-radius: var(--geist-radius);
          border-bottom: 1px solid var(--accents-2);
          border: 1px solid var(--accents-2);
          border-bottom-color: var(--geist-background);
          background: var(--geist-background);
        }
      `}</style>
    </div>
  );
}

export interface WindowProps {
  url: string;
  title: string;
}

export default function Window({ url, title }: WindowProps): JSX.Element {
  const ref = useRef<HTMLIFrameElement>(null);
  const refresh = useCallback(() => {
    if (ref.current) ref.current.src = url;
  }, [url]);

  return (
    <div className='container'>
      <div className='window'>
        <div className='header'>
          <div className='traffic show'>
            <span className='icon close' />
            <span className='icon minimize' />
            <span className='icon fullscreen' />
          </div>
          <div className='title'>
            <Browser url={url} refresh={refresh} />
          </div>
        </div>
        <div className='body'>
          <iframe title={title} src={url} ref={ref} />
        </div>
      </div>
      <style jsx>{`
        div.container {
          max-width: 100%;
          position: relative;
          padding-bottom: calc(100% / 16 * 9);
        }

        div.window {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          color: var(--geist-foreground);
          border-radius: var(--geist-radius);
          background: var(--geist-background);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-large);
        }

        div.traffic {
          display: none;
          margin-left: var(--geist-gap-half);
        }

        div.traffic.show {
          display: block;
        }

        div.header {
          width: 100%;
          flex-basis: 45px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid var(--accents-2);
        }

        div.body {
          flex: 1 1;
          width: 100%;
          overflow: hidden;
        }

        div.body.padding {
          padding-top: var(--geist-gap-half);
        }

        iframe {
          margin: 0;
          padding: 0;
          border: none;
          width: calc(100% * 4 / 3);
          height: calc(100% * 4 / 3);
          transform: scale(0.75);
          transform-origin: left top;
          background: white;
        }

        span.icon {
          border-radius: 50%;
          display: inline-block;
          width: 12px;
          height: 12px;
        }

        span.icon + span.icon {
          margin-left: 8px;
        }

        span.close {
          background-color: #ff5f56;
        }

        span.minimize {
          background-color: #ffbd2e;
        }

        span.fullscreen {
          background-color: #27c93f;
        }

        div.title {
          color: var(--accents-5);
          justify-content: center;
        }

        div.title-right,
        div.title {
          position: absolute;
          width: 100%;
          height: 45px;
          left: 0;
          font-size: 12px;
          display: flex;
          align-items: center;
        }

        div.title-right {
          font-weight: 700;
          justify-content: flex-end;
          padding-right: var(--geist-space-4x);
        }

        .caret {
          background: var(--geist-success);
          display: inline-block;
          width: 7px;
          height: 15px;
          position: relative;
          bottom: 1px;
          vertical-align: middle;
        }

        .caret.mini {
          width: 6px;
          height: 11px;
        }

        .caret.blink {
          animation: blink 1s ease infinite;
        }

        @keyframes blink {
          0% {
            opacity: 1;
          }

          50% {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        .triangle {
          color: var(--geist-foreground);
        }

        .prompt {
          color: var(--accents-5);
        }
      `}</style>
    </div>
  );
}
