import React from 'react';
import Form from '..'
import renderer from 'react-test-renderer'

test('Form changes it\'s class when hovered', () => {
  const component = renderer.create(
    <Form
      inputs={[{
        label: 'Your name',
        el: 'textfield',
        required: true,
      }, {
        label: 'Your email address',
        type: 'email',
        el: 'textfield',
      }]}
      title='Volunteer as a Tutor'
      description={
        'We are building a massive academic support network and systems to ' +
        'bolster our educational infrastructure in this difficult time. If ' +
        'you have expertise in marketing, management, teaching, tech, or just' +
        ' want to help out we would love to have you!'
      } 
      submitLabel='Volunteer to tutor'
      onSubmit={(formValues) => new Promise((res, rej) => {})}
    />
  );
  let tree = component.toJSON();
  expect(tree).toMatchSnapshot();
  
  tree.props.onMouseEnter(); // Manually trigger the callback
  tree = component.toJSON(); // Re-rendering
  expect(tree).toMatchSnapshot();
  
  tree.props.onMouseLeave(); // Manually trigger the callback
  tree = component.toJSON(); // Re-rendering
  expect(tree).toMatchSnapshot();
});
