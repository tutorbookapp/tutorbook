import React from 'react';
import Head from 'next/head';

function CovidHead(){
  return(
    <div>
      <Head>
        <title>Tutorbook</title>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1.0" />
        <meta
          name="description"
          content="Web app that enables schools to manage (online and in-person) peer tutoring like never before."
        />
      </Head>
    </div>
  );
}

export default CovidHead;
