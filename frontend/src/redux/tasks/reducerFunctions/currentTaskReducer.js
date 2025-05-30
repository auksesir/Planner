
import { SET_CURRENT_TASK } from '../actions/currentTaskActionsTypes';

const currentTaskReducer = (state = null, action) => {
  switch (action.type) {
    case SET_CURRENT_TASK:
      return action.payload;

    default:
      return state;
  }
};

export default currentTaskReducer;
