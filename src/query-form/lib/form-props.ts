import React from 'react';

import { Query } from '@tutorbook/model';

export default interface FormProps {
  query: Query;
  button: boolean;
  visible: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => any;
  onChange: (query: Query) => any;
}
