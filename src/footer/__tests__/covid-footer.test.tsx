import React from 'react'
import CovidFooter from '..'
import renderer from 'react-test-renderer'

test('Footer renders correctly', () => { 
  const tree = renderer.create(<CovidFooter />).toJSON();
  expect(tree).toMatchSnapshot();
});
