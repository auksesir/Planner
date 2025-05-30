// redux/reducers/selectedDayReducer.js
import { SET_SELECTED_DAY } from '../actions/selectedDayUIActionsTypes';

const selectedDayUIReducer = (state = null, action) => {
  switch (action.type) {
    case SET_SELECTED_DAY:
      return action.payload;
    default:
      return state;
  }
};

export default selectedDayUIReducer;
