import { FormEvent, useCallback, useState } from 'react';
import { TextField } from '@rmwc/textfield';
import axios from 'axios';
import { mutate } from 'swr';
import useTranslation from 'next-translate/useTranslation';

import AvailabilitySelect from 'components/availability-select';
import Button from 'components/button';
import Loader from 'components/loader';
import SubjectSelect from 'components/subject-select';
import Title from 'components/title';

import { User, UserJSON } from 'lib/model/user';
import { useOrg } from 'lib/context/org';

export default function RequestForm(): JSX.Element {
  const { org } = useOrg();
  const { t } = useTranslation();
  const [user, setUser] = useState<User>(new User());
  const [subjects, setSubjects] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
 
  const onSubmit = useCallback(async (evt: FormEvent) => {
    evt.preventDefault();
    setChecked(false);
    setLoading(true);
    setError('');
    try {
      const { default: firebase } = await import('lib/firebase');
      await import('firebase/auth');
      const auth = firebase.auth();
      await auth.setPersistence(firebase.auth.Auth.Persistence.NONE);
      const { data: created } = 
        await axios.post<UserJSON>('/api/users', user.toJSON());
      await auth.signInWithCustomToken(created.token as string);
      const token = await auth.currentUser?.getIdToken();
      await mutate('/api/account', axios.put('/api/account', { ...created, token }));
      await axios.post('/api/requests', { subjects, description, org: org?.id });
      setChecked(true);
      setLoading(false);
    } catch (err) {
      setChecked(false);
      setLoading(false);
      setError(`Hmm, it looks like we hit a snag. ${(err as Error).message}`);
    }
  }, [user, subjects, description, org?.id]);
  
  return (
    <div className='wrapper'>
      <header>
        <Title>Request a free volunteer tutor</Title>
        <p>Simply fill out the form below and you’ll be matched with a tutor.</p>
      </header>
      <form onSubmit={onSubmit}>
        <Loader active={loading} checked={checked} />
        <div className='section'>
          <TextField
            label='Your phone number'
            value={user.phone ? user.phone : undefined}
            onChange={(e) => {
              const phone = e.currentTarget.value;
              setUser((p) => new User({ ...p, phone }))
            }}
            className='field'
            type='tel'
            outlined
            required={org ? org.profiles.includes('phone') : false}
          />
          <TextField
            label={t('user3rd:reference', {
              org: org?.name || 'Tutorbook',
            })}
            placeholder={t('common:reference-placeholder', {
              org: org?.name || 'Tutorbook',
            })}
            value={user.reference}
            onChange={(e) => {
              const reference = e.currentTarget.value;
              setUser((p) => new User({ ...p, reference }));
            }}
            className='field'
            required={org ? org.profiles.includes('reference') : true}
            outlined
            rows={3}
            textarea
          />
        </div>
        <hr />
        <div className='section'>
          <SubjectSelect
            label='What would you like to learn?'
            placeholder={t('common:subjects-placeholder')}
            value={subjects}
            onChange={setSubjects}
            className='field'
            required={org ? org.profiles.includes('subjects') : true}
            outlined
          />
          <AvailabilitySelect
            className='field'
            label='When are you available?'
            value={user.availability}
            onChange={(availability) => setUser((p) => new User({ ...p, availability }))}
            required={org ? org.profiles.includes('availability') : true}
            outlined
          />
          <TextField
            label='What specifically do you need help with?'
            placeholder='Ex: I’m really struggling with finding definite integrals in AP Calculus BC and we’ve got a test in two weeks.'
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            className='field'
            required
            outlined
            rows={3}
            textarea
          />
          <Button
            disabled={loading}
            className='button'
            label='Login and request'
            type='submit'
            raised
            google
            arrow
          />
          {!!error && (
            <div data-cy='error' className='error'>
              {t('user3rd:error', { error })}
            </div>
          )}
        </div>
      </form>
      <style jsx>{`
        .wrapper {
          max-width: 768px;
          margin: 0 auto;
          padding: 48px 24px;
        }

        header {
          text-align: center;
          margin: 0 0 48px;
        }
        
        form {
          border: 1px solid var(--accents-2);
          border-radius: 8px;
          position: relative;
        }

        .section {
          margin: 16px;
        }

        hr {
          border: none;
          border-top: 1px solid var(--accents-2);
          margin: 8px 0;
        }

        :global(html:not(.dark)) form {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        }

        form :global(.field) {
          margin: 8px 0;
          width: 100%;
          display: inline-flex;
        }

        form :global(.field):first-child {
          margin-top: 0;
        }

        form :global(.field):last-child {
          margin-bottom: 0;
        }

        form :global(.field):global(.mdc-select__anchor) {
          width: 100%;
        }

        form :global(.field):global(.mdc-select > .mdc-menu > .mdc-list > .mdc-list-item) {
          white-space: nowrap;
        }

        form :global(.field):not(:global(.mdc-menu-surface--anchor)) textarea {
          min-height: 47px;
        }

        form :global(.field) + :global(.mdc-text-field-helper-line) {
          margin: -6px 0 8px;
        }

        form :global(.field) + :global(.mdc-text-field-helper-line) p {
          font-weight: 450;
          margin: 0;
        }

        form :global(.field) textarea {
          resize: vertical;
        }

        form :global(.button) {
          margin-top: 8px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
