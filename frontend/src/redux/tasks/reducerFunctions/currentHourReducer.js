import { SET_CURRENT_HOUR } from '../actions/currentDayandHourActionsTypes';

const currentHourReducer = (state = null, action) => {
  switch (action.type) {
    case SET_CURRENT_HOUR:
      // handle setting current hour in state
      return action.payload;
    default:
      return state;
  }
};

export default currentHourReducer;