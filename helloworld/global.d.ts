import "@testing-library/jest-dom";

declare global {
  const describe: jest.Describe;
  const it: jest.It;
  const test: jest.It;
  const expect: jest.Expect;
  const beforeEach: jest.Hook;
  const afterEach: jest.Hook;
}
