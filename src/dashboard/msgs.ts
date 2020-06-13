import { defMsg, Msg } from '@tutorbook/intl';

export default defMsg({
  overview: {
    id: 'dashboard.tabs.overview',
    defaultMessage: 'Overview',
    description: 'Label for the overview tab of the dashboard page.',
  },
  people: {
    id: 'dashboard.tabs.people',
    defaultMessage: 'People',
    description: 'Label for the overview tab of the dashboard page.',
  },
}) as Record<string, Msg>;
