// Mock for expo-task-manager
const defineTask = jest.fn();
const isTaskRegisteredAsync = jest.fn(() => Promise.resolve(false));
const isTaskDefined = jest.fn(() => false);
const registerTaskAsync = jest.fn(() => Promise.resolve());
const unregisterTaskAsync = jest.fn(() => Promise.resolve());
const unregisterAllTasksAsync = jest.fn(() => Promise.resolve());
const getTaskOptionsAsync = jest.fn(() => Promise.resolve({}));
const getRegisteredTasksAsync = jest.fn(() => Promise.resolve([]));

module.exports = {
  defineTask,
  isTaskRegisteredAsync,
  isTaskDefined,
  registerTaskAsync,
  unregisterTaskAsync,
  unregisterAllTasksAsync,
  getTaskOptionsAsync,
  getRegisteredTasksAsync,
};