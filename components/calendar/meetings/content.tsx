import { Ref, forwardRef, memo, useEffect, useMemo, useRef } from 'react';
import { dequal } from 'dequal/lite';
import mergeRefs from 'react-merge-refs';
import useTranslation from 'next-translate/useTranslation';

import { Meeting } from 'lib/model/meeting';
import { Timeslot } from 'lib/model/timeslot';
import { join } from 'lib/utils';
import { useUser } from 'lib/context/user';

import { MouseEventHackData, MouseEventHackTarget } from '../hack-types';

import styles from './content.module.scss';

export interface MeetingContentProps {
  meeting: Meeting;
  height: number;
  eventTarget?: MouseEventHackTarget;
  eventData?: MouseEventHackData;
}

const MeetingContent = forwardRef(
  (
    { meeting, height, eventTarget, eventData }: MeetingContentProps,
    ref: Ref<HTMLElement>
  ): JSX.Element => {
    const { lang: locale } = useTranslation();
    const { user } = useUser();

    const nodeRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (!eventTarget || !eventData) return;
      // If I don't use `setTimeout`, TB throws a "<DraggableCore> not mounted on
      // DragStart!" error. It goes away when waiting a tick before triggering.
      const timeoutId = setTimeout(() => {
        let targetEl: Node | null | undefined;
        switch (eventTarget) {
          case 'top':
            targetEl = nodeRef.current?.nextSibling?.lastChild;
            break;
          case 'bottom':
            targetEl = nodeRef.current?.nextSibling?.firstChild;
            break;
          default:
            targetEl = nodeRef.current;
            break;
        }
        targetEl?.dispatchEvent(
          new MouseEvent('mousedown', { ...eventData, bubbles: true })
        );
      }, 0);
      return () => clearTimeout(timeoutId);
    }, [eventTarget, eventData]);

    const headerString = useMemo(() => {
      const subjects = join(meeting.subjects);
      const student = meeting.people.find((p) => p.roles.includes('tutee'));
      const volunteer = meeting.people.find((p) => p.roles.includes('tutor'));
      if (student?.id === user.id) {
        // Students care more about the subjects than their teacher's name.
        if (volunteer?.name && subjects)
          return `${subjects} with ${volunteer.name}`;
        if (volunteer?.name) return volunteer.name;
        if (subjects) return subjects;
      } else {
        // Volunteers and orgs care more about the student than the subjects.
        if (student?.name && subjects) return `${student.name} for ${subjects}`;
        if (student?.name) return student.name;
        if (subjects) return subjects;
      }
      return '';
    }, [meeting.people, meeting.subjects, user.id]);
    const headerHeight = useMemo(() => Math.floor((height - 4) / 15) * 15, [
      height,
    ]);
    const timeString = useMemo(
      () =>
        `${(meeting.time || new Timeslot()).from.toLocaleString(locale, {
          hour: 'numeric',
          minute: 'numeric',
        })} - ${(meeting.time || new Timeslot()).to.toLocaleString(locale, {
          hour: 'numeric',
          minute: 'numeric',
        })}`,
      [meeting.time, locale]
    );

    return (
      <div ref={mergeRefs([ref, nodeRef])} className={styles.wrapper}>
        <div className={styles.content}>
          <div
            className={styles.headerWrapper}
            style={{
              maxHeight: headerHeight > 30 ? headerHeight - 15 : 15,
              whiteSpace: headerHeight < 45 ? 'nowrap' : 'normal',
            }}
          >
            {headerString && (
              <span className={styles.header}>{headerString}</span>
            )}
            {headerHeight < 30 && (
              <span className={styles.time}>
                {headerString ? `, ${timeString}` : timeString}
              </span>
            )}
          </div>
          {headerHeight > 15 && <div className={styles.time}>{timeString}</div>}
        </div>
      </div>
    );
  }
);

export default memo(MeetingContent, dequal);
