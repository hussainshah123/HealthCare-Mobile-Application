/* global jest */
/**
 * Jest mocks for native modules used by the app.
 * Note: the preset's own setup runs first; this file only adds library mocks.
 */

// AsyncStorage: official in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest'),
);

// Document picker: its official mock is loaded via `setupFiles` in jest.config.js
// (the package's `exports` map hides the file from require()).

// Safe area context: official mock.
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);

// Geolocation: no native module in tests.
jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    getCurrentPosition: jest.fn(),
    watchPosition: jest.fn(() => 1),
    clearWatch: jest.fn(),
    stopObserving: jest.fn(),
    requestAuthorization: jest.fn(success => success && success()),
    setRNConfiguration: jest.fn(),
  },
}));

// Maps: render plain Views.
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  class MockMapView extends React.Component {
    fitToCoordinates() {}
    animateToRegion() {}
    render() {
      return React.createElement(View, this.props, this.props.children);
    }
  }
  const Mock = props => React.createElement(View, props, props.children);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: Mock,
    Polyline: Mock,
    PROVIDER_GOOGLE: 'google',
  };
});

// socket.io-client: never open real connections in tests.
jest.mock('socket.io-client', () => {
  const makeSocket = () => ({
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn(),
  });
  return { io: jest.fn(() => makeSocket()) };
});
