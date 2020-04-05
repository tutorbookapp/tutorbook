import React from 'react'
import Button from '..'
import renderer from 'react-test-renderer'

test('Button renders correctly', () => {
  const tree = renderer.create(<Button arrow label='Click me' />).toJSON();
  expect(tree).toMatchSnapshot();
});
