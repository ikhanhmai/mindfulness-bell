// Mock for expo-background-fetch
const BackgroundFetchResult = {
  NoData: 'noData',
  NewData: 'newData',
  Failed: 'failed',
};

const BackgroundFetchStatus = {
  Denied: 'denied',
  Restricted: 'restricted',
  Available: 'available',
};

const getStatusAsync = jest.fn(() => Promise.resolve(BackgroundFetchStatus.Available));
const setMinimumIntervalAsync = jest.fn(() => Promise.resolve());
const registerTaskAsync = jest.fn(() => Promise.resolve());
const unregisterTaskAsync = jest.fn(() => Promise.resolve());

module.exports = {
  BackgroundFetchResult,
  BackgroundFetchStatus,
  getStatusAsync,
  setMinimumIntervalAsync,
  registerTaskAsync,
  unregisterTaskAsync,
};