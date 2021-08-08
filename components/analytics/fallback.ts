import { AnalyticsRes, AnalyticsSnapshot } from 'pages/api/orgs/[id]/analytics';

// The default 3mo timeline shows relatively linear growth for all data points.
function getFallbackNums(): AnalyticsRes {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end.valueOf() - 78894e5);
  const timeline: AnalyticsSnapshot[] = [];

  function getY(date: Date, range: [number, number]): number {
    return (
      ((range[1] - range[0]) / (end.valueOf() - start.valueOf())) *
        (date.valueOf() - start.valueOf()) +
      range[0]
    );
  }

  // Simulate some random volatility (similar to how stock prices fluctuate).
  // @see {@link https://stackoverflow.com/a/8597889/10023158}
  function getRandY(
    date: Date,
    range: [number, number],
    prev?: number
  ): number {
    const oldY = getY(new Date(date.valueOf() - 864e5), range);
    const rnd = Math.random();
    const volatility = 0.01;
    let changePercent = 2 * volatility * rnd;
    if (changePercent > volatility) changePercent -= 2 * volatility;
    const changeAmount = oldY * changePercent;
    return Math.round(Math.max(oldY + changeAmount, prev || oldY));
  }

  let date = start;
  while (date <= end) {
    const prev = timeline[timeline.length - 1];
    timeline.push({
      date: date.valueOf(),
      tutors: getRandY(date, [200, 300], prev?.tutors),
      tutees: getRandY(date, [150, 350], prev?.tutees),
      meetings: getRandY(date, [400, 900], prev?.meetings),
    });
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  }

  const current = timeline[timeline.length - 1];
  return {
    timeline,
    tutors: { change: 12.5, total: current.tutors },
    tutees: { change: 12.5, total: current.tutees },
    meetings: {
      change: 32.5,
      total: current.meetings,
      recurring: Math.round(0.85 * current.meetings),
    },
  };
}

export default getFallbackNums();
