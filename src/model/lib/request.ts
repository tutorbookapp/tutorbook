import { TimeUtils, Timeslot } from './times';

export interface LessonRequestInterface {
  subjects: string[];
  attendees: string[];
  time: Timeslot;
}

export class LessonRequest implements LessonRequestInterface {
  public subjects = [];
  public attendees = []; // TODO: Why is default time is 7-8am on Mondays?
  public time = new Timeslot(TimeUtils.getDate(1, 7), TimeUtils.getDate(1, 8));

  /**
   * Wrap your boring `Record`s with this class to ensure that they have all of
   * the needed `LessonRequestInterface` values (we fill any missing values w/
   * the above specified defaults) **and** to gain access to a bunch of useful
   * conversion method, etc (e.g. `toString` actually makes sense now).
   * @todo Actually implement a useful `toString` method here.
   */
  public constructor(request: Partial<LessonRequestInterface> = {}) {
    Object.entries(request).map(([key, val]: [string, any]) => {
      if (!val) delete (request as Record<string, any>)[key];
    });
    Object.assign(this, request);
  }
}
