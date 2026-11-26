/**
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders the login screen when signed out', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  // Let the session restore (empty AsyncStorage mock) settle.
  await ReactTestRenderer.act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });

  const texts = renderer!.root
    .findAllByType(Text)
    .map(node => [node.props.children].flat().join(''));
  expect(texts).toContain('Sign in to continue');
  expect(texts).toContain('Sign in');

  await ReactTestRenderer.act(async () => {
    renderer!.unmount();
  });
});
