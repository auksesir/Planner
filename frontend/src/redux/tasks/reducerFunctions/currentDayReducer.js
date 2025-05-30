import { SET_CURRENT_DAY } from '../actions/currentDayandHourActionsTypes';

const currentDayReducer = (state = null, action) => {
  switch (action.type) {
    case SET_CURRENT_DAY:
      // handle setting current day in state
      return action.payload;
    default:
      return state;
  }
};

export default currentDayReducer;