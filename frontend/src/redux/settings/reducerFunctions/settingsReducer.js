// redux/settings/reducerFunctions/settingsReducer.js
import { SET_SOUND_SETTINGS, SET_SOUND_VOLUME, SET_TIME_SLOT_SETTINGS, TOGGLE_SOUND } from '../actions/settingsActionsTypes';

const initialState = {
  startHour: '12:00 AM',
  endHour: '11:00 PM',
  hiddenHours: [],
  // Add sound settings
  soundSettings: {
    enabled: true,
    volume: 0.7, // Default volume (0-1)
    reminderSound: 'reminder',
    taskSound: 'task'
  }
};

export const settingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_TIME_SLOT_SETTINGS:
      return {
        ...state,
        startHour: action.payload.start_hour,
        endHour: action.payload.end_hour,
        hiddenHours: action.payload.hidden_hours || [] // Ensure we handle null/undefined
      };
    case SET_SOUND_SETTINGS:
      return {
        ...state,
        soundSettings: {
          ...state.soundSettings,
          ...action.payload
        }
      };
    case TOGGLE_SOUND:
      return {
        ...state,
        soundSettings: {
          ...state.soundSettings,
          enabled: !state.soundSettings.enabled
        }
      };
    case SET_SOUND_VOLUME:
      return {
        ...state,
        soundSettings: {
          ...state.soundSettings,
          volume: action.payload
        }
      };
    default:
      return state;
  }
};

export default settingsReducer;