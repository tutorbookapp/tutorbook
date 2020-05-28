import { User, Query, Aspect } from '@tutorbook/model';

import QueryForm from '@tutorbook/query-form';

import Title from './title';
import About from './about';
import Carousel from './carousel';
import UserCard from './user-card';

import styles from './hero.module.scss';

export default function Hero({ query }: { query: Query }): JSX.Element {
  const demoUser: User = new User({
    name: 'Luke Hsiao',
    bio:
      'Stanford EE PhD candidate currently interning at Google. Had previous ' +
      'experience with machine learning (created Fonduer to extract ' +
      'multimodal relations from datasheet-like documents) but mostly working' +
      ' in video and image manipulation nowadays.',
    mentoring: { subjects: ['Computer Science', 'Python', 'AI'], searches: [] },
  });
  return (
    <div className={styles.wrapper}>
      <Title aspect={query.aspect} />
      <QueryForm query={query} />
      <div className={styles.carousel}>
        <Carousel title='Open source projects'>
          {Array(5)
            .fill(null)
            .map((_: null, index: number) => (
              <UserCard key={index} user={demoUser} aspect={query.aspect} />
            ))}
        </Carousel>
      </div>
      <div className={styles.carousel}>
        <Carousel title='Expert creators'>
          {Array(5)
            .fill(null)
            .map((_: null, index: number) => (
              <UserCard key={index} user={demoUser} aspect={query.aspect} />
            ))}
        </Carousel>
      </div>
      <About />
    </div>
  );
}
