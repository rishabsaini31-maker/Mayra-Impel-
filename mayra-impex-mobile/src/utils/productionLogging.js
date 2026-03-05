export const configureProductionLogging = () => {
  if (__DEV__) {
    return;
  }

  // Keep warnings/errors visible, silence debug noise in release builds.
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
};
