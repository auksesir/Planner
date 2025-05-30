import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import { getRemindersForDay, getTasksForDay } from './api/api'; // Assuming these functions are implemented correctly in api.js
import store from './store';

jest.mock('./api/api', () => ({
  getTasksForDay: jest.fn(),
  getRemindersForDay: jest.fn(),
}));

describe('App Component', () => {
  test('loads tasks and reminders for the current day upon opening', async () => {
    // Mock tasks and reminders data
    const tasksForDay = [{ id: 1, name: 'Task 1' }];
    const remindersForDay = [{ id: 1, name: 'Reminder 1' }];

    // Mock the API functions to return mock data
    getTasksForDay.mockResolvedValue(tasksForDay);
    getRemindersForDay.mockResolvedValue(remindersForDay);

    // Render the component with Redux store and Router
    render(
      <Provider store={store}>
        <Router>
          <App />
        </Router>
      </Provider>
    );

    // Wait for the tasks and reminders to be loaded
    await waitFor(() => {
      // Assert that the tasks and reminders are rendered in the UI or stored in Redux state
      expect(getTasksForDay).toHaveBeenCalled();
      expect(getRemindersForDay).toHaveBeenCalled();
      // You can further test if the tasks and reminders are displayed correctly in the UI or stored in Redux state
    });
  });

  // Add more tests as needed for other functionality
});
