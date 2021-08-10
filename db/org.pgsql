insert into orgs values (
  'jls',
  'JLS Middle School',
  null,
  null,
  '+16508565188',
  'JLS is a public middle school that promotes an intellectually rigorous academic experience within a supportive community that values the social, emotional and physical well being of all students. We provide a rich and engaging environment that is dedicated to preparing our students to understand, contribute to, and succeed in a changing world.',
  null,
  null,
  array[]::social[],
  array['pausd.us', 'pausd.org'],
  -- TODO: Check that at least one contact info field is included.
  array['name', 'email', 'bio', 'subjects', 'langs', 'availability']::profile_field[],
  null,
  -- TODO: Verify these are valid config objects.
  '{}',
  '{}',
  '{}',
  '2021-08-10T00:20:55.150Z',
  '2021-08-10T00:20:55.150Z'
);
