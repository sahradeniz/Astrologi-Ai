describe('API configuration', () => {
  afterEach(() => {
    delete process.env.REACT_APP_API_URL;
    jest.resetModules();
  });

  test('falls back to localhost when no environment variable is set', () => {
    const { API_URL } = require('./config');
    expect(API_URL).toBe('http://localhost:5003');
  });

  test('uses environment variable when provided', () => {
    process.env.REACT_APP_API_URL = 'https://api.example.com';
    jest.resetModules();
    const { API_URL } = require('./config');
    expect(API_URL).toBe('https://api.example.com');
  });
});
