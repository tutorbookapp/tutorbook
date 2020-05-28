import React from 'react';

import { Query } from '@tutorbook/model';

export default interface FormProps {
  visible: boolean;
  query: Query;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => any;
}
