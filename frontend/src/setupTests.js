// src/setupTests.js
import '@testing-library/jest-dom';

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, value) { this.store[key] = value.toString(); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};
window.localStorage = localStorageMock;

// Mock date-fns if needed
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: date => date.toString(),
}));

// Mock MUI Date Pickers
jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: jest.fn().mockImplementation(() => ({
    format: date => date.toString(),
    parse: date => new Date(date),
  })),
}));

// React Router v6 mock
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn().mockReturnValue({ pathname: '/' }),
  useNavigate: jest.fn().mockReturnValue(jest.fn()),
  useParams: jest.fn().mockReturnValue({}),
  Link: ({ children }) => children,
  NavLink: ({ children }) => children,
  Outlet: () => null,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
}));
