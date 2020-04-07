import React from 'react'
import { RMWCProvider } from '@rmwc/provider'
import { Typography } from '@rmwc/typography'

import styles from './hero-about.module.scss'

export default function HeroAbout() {
  return (
    <RMWCProvider 
      typography={{
        defaultTag: 'div',
        headline1: 'h1',
        headline2: 'h2',
        headline3: 'h3',
        headline4: 'h4',
        headline5: 'h5',
        headline6: 'h6',
        body1: 'p',
        body2: 'p',
      }}
    >
      <div className={styles.aboutWrapper}>
        <div className={styles.aboutContent}>
          <Typography use='headline1'>
            Biggest title 
          </Typography>
          <Typography use='body1'>
            Followed by a bunch of other, less important body text. This is 
            <b> bold text</b> for example. And this is in <i>italics</i>.
          </Typography>
          <Typography use='body1'>
            Ducimus est repudiandae laborum consequatur. Et incidunt magni 
            consequuntur beatae. Veritatis reiciendis similique velit quaerat 
            placeat sequi qui.
          </Typography>
          <Typography use='headline2'>
            Big, important header 
          </Typography>
          <Typography use='body1'>
            Necessitatibus officia eum odio. Ab aut voluptate odit dolor eum non 
            cum est. Qui ratione amet quas ad exercitationem deserunt 
            exercitationem. Voluptate reiciendis enim impedit aperiam. A sed 
            quibusdam sed labore consectetur mollitia est. Omnis deserunt 
            tempora maxime molestiae.
          </Typography>
          <Typography use='body1'>
            Blanditiis at ratione enim. Est id nemo reprehenderit. Expedita 
            doloremque voluptatibus odio temporibus aperiam.
          </Typography>
          <Typography use='headline4'>
            A smaller, subsection header
          </Typography>
          <Typography use='body1'>
            Vel vero minima est quo. Distinctio harum temporibus suscipit illo 
            voluptatem sint optio. Quod nihil culpa aliquam distinctio ea minus 
            quae.
          </Typography>
          <Typography use='body1'>
            Rerum nam vitae doloribus. Consequatur odio quo repellat. Dolores 
            necessitatibus dolorem tempora odit exercitationem. In et explicabo 
            sed odit ratione non. Placeat rem esse doloribus omnis aperiam harum 
            et odio. Nihil similique eos ut.
          </Typography>
        </div>
      </div>
    </RMWCProvider>
  );
}
