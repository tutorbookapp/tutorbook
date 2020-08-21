import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { TextField } from '@rmwc/textfield';
import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';
import { v4 as uuid } from 'uuid';

import UserSelect from 'components/user-select';
import { TimesSelectProps } from 'components/times-select';
import SubjectSelect from 'components/subject-select';

import { Availability, Match, Option, Person, Role } from 'lib/model';

import { InputsConfig, InputsProps } from './types';

const TimesSelect = dynamic<TimesSelectProps>(async () =>
  import('components/times-select')
);

function getValue(people: Person[], role: Role): Option<string>[] {
  return people
    .filter((a) => a.roles.indexOf(role) >= 0)
    .map((a) => ({ value: a.id, label: a.name }));
}

interface Props {
  subjectOptions: string[];
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
  subjectOptions,
  times,
  message,
}: Props & InputsProps<Match, Input> & InputsConfig<Input>): JSX.Element {
  const onTutorsChange = useCallback(
    (tutors: Option<string>[]) => {
      const people = [
        ...value.people.filter((a) => a.roles.indexOf('tutor') < 0),
        ...tutors.map((a) => ({
          id: a.value,
          name: a.label,
          roles: ['tutor'],
          handle: uuid(),
        })),
      ] as Person[];
      onChange(new Match({ ...value, people }));
    },
    [onChange, value]
  );
  const onTuteesChange = useCallback(
    (tutees: Option<string>[]) => {
      const people = [
        ...value.people.filter((a) => a.roles.indexOf('tutee') < 0),
        ...tutees.map((a) => ({
          id: a.value,
          name: a.label,
          roles: ['tutee'],
          handle: uuid(),
        })),
      ] as Person[];
      onChange(new Match({ ...value, people }));
    },
    [onChange, value]
  );
  const onMentorsChange = useCallback(
    (mentors: Option<string>[]) => {
      const people = [
        ...value.people.filter((a) => a.roles.indexOf('mentor') < 0),
        ...mentors.map((a) => ({
          id: a.value,
          name: a.label,
          roles: ['mentor'],
          handle: uuid(),
        })),
      ] as Person[];
      onChange(new Match({ ...value, people }));
    },
    [onChange, value]
  );
  const onMenteesChange = useCallback(
    (mentees: Option<string>[]) => {
      const people = [
        ...value.people.filter((a) => a.roles.indexOf('mentee') < 0),
        ...mentees.map((a) => ({
          id: a.value,
          name: a.label,
          roles: ['mentee'],
          handle: uuid(),
        })),
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
          onSelectedChange={onTutorsChange}
          selected={tutors}
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
          onSelectedChange={onTuteesChange}
          selected={tutees}
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
          onSelectedChange={onMentorsChange}
          selected={mentors}
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
          onSelectedChange={onMenteesChange}
          selected={mentees}
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
          options={subjectOptions}
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
