import { SET_WEEKLY_GRID_OPEN } from '../actions/weeklyGridActionsTypes';

const initialState = false;

const weeklyGridReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_WEEKLY_GRID_OPEN:
      return action.payload;
    default:
      return state;
  }
};

export default weeklyGridReducer;