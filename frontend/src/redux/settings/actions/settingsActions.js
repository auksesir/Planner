// redux/settings/actions/settingsActions.js
import { SET_SOUND_SETTINGS, SET_SOUND_VOLUME, SET_TIME_SLOT_SETTINGS, TOGGLE_SOUND } from './settingsActionsTypes';

export const setTimeSlotSettings = (settings) => ({
  type: SET_TIME_SLOT_SETTINGS,
  payload: {
    start_hour: settings.start_hour,
    end_hour: settings.end_hour,
    hidden_hours: settings.hidden_hours
  }
});

export const setSoundSettings = (settings) => ({
  type: SET_SOUND_SETTINGS,
  payload: settings
});

export const toggleSound = () => ({
  type: TOGGLE_SOUND
});

export const setSoundVolume = (volume) => ({
  type: SET_SOUND_VOLUME,
  payload: volume
});