/* eslint-env jest */
const mockStore: Record<string, string> = {};

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
  setItem: jest.fn((key: string, val: string) => {
    mockStore[key] = String(val);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStore[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
    return Promise.resolve();
  }),
}));

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

jest.mock('@notifee/react-native', () => ({
  createChannel: jest.fn(() => Promise.resolve('channel-id')),
  createTriggerNotification: jest.fn(),
  getTriggerNotificationIds: jest.fn(() => Promise.resolve([])),
  cancelTriggerNotifications: jest.fn(),
  requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
  AndroidImportance: { HIGH: 4 },
  AndroidVisibility: { PUBLIC: 1 },
  AuthorizationStatus: { AUTHORIZED: 1 },
  TriggerType: { TIMESTAMP: 0 },
}));

jest.mock('@react-native-community/geolocation', () => ({
  requestAuthorization: jest.fn(),
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}));

jest.mock('react-native-compass-heading', () => ({
  start: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View,
    default: View,
  };
});

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('react-native-reanimated', () => {
  const { View, Text, ScrollView } = require('react-native');
  const animChain = () => ({
    duration: animChain,
    delay: animChain,
    springify: animChain,
    damping: animChain,
  });

  return {
    __esModule: true,
    default: {
      View,
      Text,
      ScrollView,
      createAnimatedComponent: (c: any) => c,
    },
    useSharedValue: (init: any) => ({ value: init }),
    useAnimatedStyle: () => ({}),
    useAnimatedProps: () => ({}),
    withTiming: (toValue: any) => toValue,
    withSpring: (toValue: any) => toValue,
    withSequence: (...args: any[]) => args[0],
    withRepeat: (anim: any) => anim,
    withDelay: (_: any, anim: any) => anim,
    cancelAnimation: jest.fn(),
    FadeIn: animChain(),
    FadeInDown: animChain(),
    FadeInRight: animChain(),
    ZoomIn: animChain(),
    FadeOut: animChain(),
    LinearTransition: animChain(),
    SlideInDown: animChain(),
  };
});
