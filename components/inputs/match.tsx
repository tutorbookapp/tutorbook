import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  FormEvent,
} from 'react';
import UserSelect from 'components/user-select';
import SubjectSelect from 'components/subject-select';

import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

import { v4 as uuid } from 'uuid';

import { TextField } from '@rmwc/textfield';
import { Match, Person, Role, Availability } from 'lib/model';
import { TimesSelectProps } from 'components/times-select';
import { InputsProps, InputsConfig } from './types';

const TimesSelect = dynamic<TimesSelectProps>(async () =>
  import('components/times-select')
);

function getValue(people: Person[], role: Role): string[] {
  return people.filter((a) => a.roles.indexOf(role) >= 0).map((a) => a.id);
}

type Input =
  | 'subjects'
  | 'times'
  | 'message'
  | 'tutors'
  | 'tutees'
  | 'mentors'
  | 'mentees';

export default function MatchInputs({
  value,
  onChange,
  focused: focusTarget,
  renderToPortal,
  className,
  tutors: showTutors,
  tutees: showTutees,
  mentors: showMentors,
  mentees: showMentees,
  subjects,
  times,
  message,
}: InputsProps<Match, Input> & InputsConfig<Input>): JSX.Element {
  const onTutorsChange = useCallback(
    (ids: string[]) => {
      const people = [
        ...value.people.filter((a) => a.roles.indexOf('tutor') < 0),
        ...ids.map((id) => ({ id, roles: ['tutor'], handle: uuid() })),
      ] as Person[];
      onChange(new Match({ ...value, people }));
    },
    [onChange, value]
  );
  const onTuteesChange = useCallback(
    (ids: string[]) => {
      const people = [
        ...value.people.filter((a) => a.roles.indexOf('tutee') < 0),
        ...ids.map((id) => ({ id, roles: ['tutee'], handle: uuid() })),
      ] as Person[];
      onChange(new Match({ ...value, people }));
    },
    [onChange, value]
  );
  const onMentorsChange = useCallback(
    (ids: string[]) => {
      const people = [
        ...value.people.filter((a) => a.roles.indexOf('mentor') < 0),
        ...ids.map((id) => ({ id, roles: ['mentor'], handle: uuid() })),
      ] as Person[];
      onChange(new Match({ ...value, people }));
    },
    [onChange, value]
  );
  const onMenteesChange = useCallback(
    (ids: string[]) => {
      const people = [
        ...value.people.filter((a) => a.roles.indexOf('mentee') < 0),
        ...ids.map((id) => ({ id, roles: ['mentee'], handle: uuid() })),
      ] as Person[];
      onChange(new Match({ ...value, people }));
    },
    [onChange, value]
  );
  const onSubjectsChange = useCallback(
    (s: string[]) => {
      onChange(new Match({ ...value, subjects: s }));
    },
    [onChange, value]
  );
  const onTimesChange = useCallback(
    (a: Availability) => {
      onChange(new Match({ ...value, times: a }));
    },
    [onChange, value]
  );
  const onMessageChange = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      onChange(new Match({ ...value, message: e.currentTarget.value }));
    },
    [onChange, value]
  );

  const { t } = useTranslation();
  const [focused, setFocused] = useState<Input | undefined>(focusTarget);

  const focusTutors = useCallback(() => setFocused('tutors'), []);
  const focusTutees = useCallback(() => setFocused('tutees'), []);
  const focusMentors = useCallback(() => setFocused('mentors'), []);
  const focusMentees = useCallback(() => setFocused('mentees'), []);
  const focusSubjects = useCallback(() => setFocused('subjects'), []);
  const focusTimes = useCallback(() => setFocused('times'), []);
  const focusMessage = useCallback(() => setFocused('message'), []);
  const focusNothing = useCallback(() => setFocused(undefined), []);

  useEffect(() => setFocused(focusTarget), [focusTarget]);

  const tutors = useMemo(() => {
    return getValue(value.people, 'tutor');
  }, [value.people]);
  const tutees = useMemo(() => {
    return getValue(value.people, 'tutee');
  }, [value.people]);
  const mentors = useMemo(() => {
    return getValue(value.people, 'mentor');
  }, [value.people]);
  const mentees = useMemo(() => {
    return getValue(value.people, 'mentee');
  }, [value.people]);

  return (
    <>
      {showTutors && (
        <UserSelect
          focused={focused === 'tutors'}
          label={t('common:tutors')}
          onFocused={focusTutors}
          onBlurred={focusNothing}
          onChange={onTutorsChange}
          value={tutors}
          renderToPortal={renderToPortal}
          className={className}
          outlined
        />
      )}
      {showTutees && (
        <UserSelect
          focused={focused === 'tutees'}
          label={t('common:tutees')}
          onFocused={focusTutees}
          onBlurred={focusNothing}
          onChange={onTuteesChange}
          value={tutees}
          renderToPortal={renderToPortal}
          className={className}
          outlined
        />
      )}
      {showMentors && (
        <UserSelect
          focused={focused === 'mentors'}
          label={t('common:mentors')}
          onFocused={focusMentors}
          onBlurred={focusNothing}
          onChange={onMentorsChange}
          value={mentors}
          renderToPortal={renderToPortal}
          className={className}
          outlined
        />
      )}
      {showMentees && (
        <UserSelect
          focused={focused === 'mentees'}
          label={t('common:mentees')}
          onFocused={focusMentees}
          onBlurred={focusNothing}
          onChange={onMenteesChange}
          value={mentees}
          renderToPortal={renderToPortal}
          className={className}
          outlined
        />
      )}
      {subjects && (
        <SubjectSelect
          required
          focused={focused === 'subjects'}
          label={t('match:subjects')}
          onFocused={focusSubjects}
          onBlurred={focusNothing}
          onChange={onSubjectsChange}
          value={value.subjects}
          autoOpenMenu
          renderToPortal={renderToPortal}
          className={className}
          outlined
        />
      )}
      {times && (
        <TimesSelect
          focused={focused === 'times'}
          label={t('match:times')}
          onFocused={focusTimes}
          onBlurred={focusNothing}
          onChange={onTimesChange}
          value={value.times || new Availability()}
          renderToPortal={renderToPortal}
          className={className}
          outlined
        />
      )}
      {message && (
        <TextField
          textarea
          rows={4}
          required
          characterCount
          maxLength={700}
          label={t('match:message')}
          placeholder={t('match:message-placeholder', {
            subject: value.subjects[0] || 'Computer Science',
          })}
          onFocus={focusMessage}
          onBlur={focusNothing}
          onChange={onMessageChange}
          value={value.message}
          className={className}
          outlined
        />
      )}
    </>
  );
}
