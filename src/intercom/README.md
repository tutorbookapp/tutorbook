# react-intercom

A component to configure and enable Intercom in your react application.
`react-intercom` is meant to support both the legacy and current versions of
Intercom Messenger. If you run into issues, please submit an issue. Pull
requests are also welcome!

This package was originally a fork of [this
repository](https://github.com/nhagen/react-intercom). We just re-implemented
the same API surface using Typescript and updated React lifecycle methods (e.g.
the `componentWillReceiveProps` method was deprecated a while ago so we're using
`componentDidUpdate` instead).

## Installation

```bash
npm i @tutorbook/react-intercom --save
```

## Usage

Inside of your application where you would be running Intercom, insert `Intercom`:

```js
import React from 'react';
import Intercom from '@tutorbook/react-intercom';

export class App extends React.Component {
  render() {
    const { appUser } = this.props;

    const user = {
      user_id: appUser.id,
      email: appUser.email,
      name: appUser.name,
    };

    return (
      <div className='app'>
        <Intercom appID='az33rewf' {...user} />
      </div>
    );
  }
}
```

This loads the JavaScript required to boot Intercom, and will update the
settings when the props change. For example, when the active user changes in the
application, new props should be passed to reflect that, and Intercom will be
registering the new user. `react-intercom` also exports the singleton
`window.Intercom` if you'd rather interact with a module than `window`. For
example, where you'd like to log an event in your application:

```js
import { IntercomAPI } from '@tutorbook/react-intercom';
IntercomAPI('trackEvent', 'invited-friend');
```

This is, of course, equivalent to just calling
`window.Intercom('trackEvent', 'invited-friend');` or even
`Intercom('trackEvent', 'invited-friend');`.
