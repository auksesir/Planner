import { SET_SELECTED_DAY } from './selectedDayUIActionsTypes';

export const setSelectedDayUI = (day) => {
  return {
    type: SET_SELECTED_DAY,
    payload: day,
  };
};

