// src/store.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './redux/reducers';

// Initial state setup
const initialState = {
  tasks: {},
  reminders: {},
  currentDay: new Date().toISOString().split('T')[0],
  currentHour: null,
  currentTask: null,
  selectedDayUI: new Date().toISOString().split('T')[0],
  dailyPlannerFlag: false,
  weeklyGridOpen: false,
  settings: {
    startHour: '12:00 AM',
    endHour: '11:00 PM',
    hiddenHours: [],
    soundSettings: {
      enabled: true,
      volume: 0.7
    }
  }
};

// Create store with Redux Toolkit
const store = configureStore({
  reducer: rootReducer,
  preloadedState: initialState,
  // Add middleware if needed
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false, // Disable if you have non-serializable values like Date objects
    })
});

export default store;