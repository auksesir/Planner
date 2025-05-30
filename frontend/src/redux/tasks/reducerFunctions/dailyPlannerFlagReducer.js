// tasksReducer.js
import { SET_SELECTED_DAY_FLAG } from '../actions/dailyPlannerFlagActionsTypes';

const dailyPlannerFlagReducer = (state = false, action) => {
  switch (action.type) {
    case SET_SELECTED_DAY_FLAG:
      return action.payload;
    default:
      return state;
  }
};

export default dailyPlannerFlagReducer;
