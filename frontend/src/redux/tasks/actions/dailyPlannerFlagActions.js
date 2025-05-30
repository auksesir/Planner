import { SET_SELECTED_DAY_FLAG } from './dailyPlannerFlagActionsTypes';
// In your dailyPlannerFlagActions.js file:
export const setSelectedDayFlag = (value) => {
  return {
    type: SET_SELECTED_DAY_FLAG,
    payload: value, // This should be a boolean (true/false)
  };
};

