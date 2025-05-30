// redux/reducers.js
import { combineReducers } from 'redux';
import remindersReducer from './reminders/reducerFunctions/remindersReducer';
import settingsReducer from './settings/reducerFunctions/settingsReducer';
import currentDayReducer from './tasks/reducerFunctions/currentDayReducer';
import currentHourReducer from './tasks/reducerFunctions/currentHourReducer';
import currentTaskReducer from './tasks/reducerFunctions/currentTaskReducer';
import dailyPlannerFlagReducer from './tasks/reducerFunctions/dailyPlannerFlagReducer';
import selectedDayUIReducer from './tasks/reducerFunctions/selectedDayUIReducer';
import tasksReducer from './tasks/reducerFunctions/tasksReducer';
import weeklyGridReducer from './tasks/reducerFunctions/weeklyGridReducer';

const rootReducer = combineReducers({
  tasks: tasksReducer,
  reminders: remindersReducer,
  currentTask: currentTaskReducer,
  currentHour: currentHourReducer,
  currentDay: currentDayReducer,
  selectedDayUI: selectedDayUIReducer,
  dailyPlannerFlag: dailyPlannerFlagReducer,
  settings: settingsReducer,
  weeklyGridOpen: weeklyGridReducer,
});

export default rootReducer;
