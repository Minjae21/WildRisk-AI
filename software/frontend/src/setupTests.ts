import "@testing-library/jest-dom";
// import '@testing-library/jest-dom/extend-expect'; // Use this if matchers aren't available globally

// You can add other global setup here, like mocking global objects if necessary
// Example: Mocking matchMedia (sometimes needed for UI libraries)
// beforeAll(() => {
//   Object.defineProperty(window, 'matchMedia', {
//     writable: true,
//     value: vi.fn().mockImplementation(query => ({
//       matches: false,
//       media: query,
//       onchange: null,
//       addListener: vi.fn(), // deprecated
//       removeListener: vi.fn(), // deprecated
//       addEventListener: vi.fn(),
//       removeEventListener: vi.fn(),
//       dispatchEvent: vi.fn(),
//     })),
//   });
// });

import { mockGoogleMapsApi } from "./test-utils/GoogleMapsMock"; // Path to your mock

beforeAll(() => {
  mockGoogleMapsApi();
});
