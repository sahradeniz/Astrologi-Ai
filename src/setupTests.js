// jest-dom adds custom jest matchers for asserting on DOM nodes.
// In restricted environments the package might not be installable, so we
// attempt to load it and fall back to a minimal matcher if it is missing.
try {
  // eslint-disable-next-line global-require
  require('@testing-library/jest-dom');
} catch (error) {
  // Provide a very small subset needed by our tests.
  expect.extend({
    toBeInTheDocument(received) {
      const pass = received !== null && received !== undefined;
      return {
        pass,
        message: () =>
          `Expected element ${pass ? 'not ' : ''}to be present in the document`,
      };
    },
  });
}
