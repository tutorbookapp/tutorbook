import React from 'react';
import Router from 'next/router';
import Form, { InputElAlias } from '@tutorbook/covid-form';
import { User } from '@tutorbook/model';
import { AxiosError, AxiosResponse } from 'axios';

import axios from 'axios';
import to from 'await-to-js';

import styles from './hero-form.module.scss';

/**
 * React component that emulates AirBNB's landing page form and collects the
 * following information from pupils (and creates their Firestore user document
 * along the way).
 * - (name) Your name
 * - (email) Your email address
 * - (searches.explicit) What would you like to learn?
 * - (availability) When are you available?
 */
export default function HeroForm() {
  return (
    <>
      <div className={styles.heroFormWrapper}>
        <div className={styles.heroFormInnerWrapper}>
          <Form
            inputs={[
              {
                label: 'Your name',
                el: 'textfield' as InputElAlias,
                required: true,
                key: 'name',
              },
              {
                label: 'Your email address',
                el: 'textfield' as InputElAlias,
                type: 'email',
                required: true,
                key: 'email',
              },
              {
                label: 'What would you like to learn?',
                el: 'subjectselect' as InputElAlias,
                required: true,
                key: 'searches',
              },
              {
                label: 'When are you available?',
                el: 'scheduleinput' as InputElAlias,
                required: true,
                key: 'availability',
              },
            ]}
            submitLabel='Request free tutoring'
            onFormSubmit={async (formValues) => {
              const pupil: User = new User(formValues);
              const [err, res] = await to<AxiosResponse, AxiosError>(
                axios({
                  method: 'post',
                  url: '/api/signup',
                  data: {
                    user: pupil.toJSON(),
                  },
                })
              );
              if (err && err.response) {
                // The request was made and the server responded with a status
                // code that falls out of the range of 2xx
                console.log(err.response.data);
                console.log(err.response.status);
                console.log(err.response.headers);
                console.log(err.response);
              } else if (err && err.request) {
                // The request was made but no response was received
                // `err.request` is an instance of XMLHttpRequest in the
                // browser and an instance of http.ClientRequest in node.js
                console.log(err.request);
              } else if (err) {
                // Something happened in setting up the request that triggered
                // an err
                console.log('err', err.message);
              }
              console.log('[DEBUG] Got sign-up response:', res);
              Router.push(pupil.searchURL);
            }}
            className={styles.heroForm}
            cardProps={{
              className: styles.heroFormCard,
            }}
          />
        </div>
      </div>
      <div className={styles.heroBackground} />
    </>
  );
}
