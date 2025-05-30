import { SET_WEEKLY_GRID_OPEN } from './weeklyGridActionsTypes';

export const setWeeklyGridOpen = (isOpen) => ({
  type: SET_WEEKLY_GRID_OPEN,
  payload: isOpen,
});