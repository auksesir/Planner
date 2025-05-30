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
  getItem: function(key) { return this.store[key] || null; },
  setItem: function(key, value) { this.store[key] = value.toString(); },
  removeItem: function(key) { delete this.store[key]; },
  clear: function() { this.store = {}; }
};
window.localStorage = localStorageMock;

// Mock date-fns if needed 
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  format: (date) => date.toString(),
}));

// Mock MUI Date Pickers 
jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: jest.fn().mockImplementation(() => ({
    format: (date) => date.toString(),
    parse: (date) => new Date(date),
  })),
}));

// UPDATED: Mock react-router-dom with proper useLocation function
jest.mock('react-router-dom', () => {
  // Create a proper implementation of useLocation that returns an object with pathname
  const useLocation = jest.fn().mockReturnValue({ pathname: '/' });
  
  return {
    useLocation: useLocation,
    useNavigate: jest.fn().mockReturnValue(jest.fn()),
    useParams: jest.fn().mockReturnValue({}),
    Link: ({ children }) => children,
    NavLink: ({ children }) => children,
    Routes: ({ children }) => children,
    Route: ({ children }) => children,
    Outlet: () => null,
    useRouteMatch: jest.fn().mockReturnValue({ path: '/', url: '/' }),
    useHistory: jest.fn().mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      goBack: jest.fn()
    }),
    // Add any other exports from react-router-dom that your app might use
  };
});