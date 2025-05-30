import { SET_CURRENT_DAY, SET_CURRENT_HOUR } from './currentDayandHourActionsTypes';

// currentHour actions
export const setCurrentHourAction = (hour) => ({
  type: SET_CURRENT_HOUR,
  payload: hour,
});

// currentDay actions
export const setCurrentDayAction = (day) => ({
  type: SET_CURRENT_DAY,
  payload: day,
});
