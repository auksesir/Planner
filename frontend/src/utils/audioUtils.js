// utils/audioUtils.js
import store from '../store';

// Create and cache audio elements for better performance
const audioCache = {};

/**
 * Plays a notification sound
 * @param {string} soundType - The type of sound to play ('reminder' or 'task')
 * @param {number} volume - Volume level between 0 and 1 (default: from settings)
 * @returns {Promise} - A promise that resolves when the audio finishes playing
 */
export const playNotificationSound = (soundType = 'reminder', volume = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Get sound settings from Redux store
      const state = store.getState();
      const soundSettings = state.settings?.soundSettings || { enabled: true, volume: 0.7 };
      
      // If sounds are disabled in settings, resolve immediately without playing
      if (!soundSettings.enabled) {
        ('Sound notifications are disabled in settings');
        resolve();
        return;
      }
      
      // Use provided volume or fall back to settings volume
      const effectiveVolume = volume !== null ? volume : soundSettings.volume;
      
      // Define sound URLs - using standard notification sounds
      const sounds = {
        reminder: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Gentle bell sound
        task: 'https://assets.mixkit.co/active_storage/sfx/1913/1913-preview.mp3',     // More attention-grabbing alert
        default: 'https://assets.mixkit.co/active_storage/sfx/1531/1531-preview.mp3'   // Fallback sound
      };
      
      const soundUrl = sounds[soundType] || sounds.default;
      
      // Check if the audio is already in cache
      if (!audioCache[soundType]) {
        audioCache[soundType] = new Audio(soundUrl);
      }
      
      const audio = audioCache[soundType];
      
      // Reset audio if it's already playing
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
      
      // Set the volume
      audio.volume = Math.min(1, Math.max(0, effectiveVolume));
      
      // Add event listeners
      audio.onended = () => {
        resolve();
      };
      
      audio.onerror = (error) => {
        ('Error playing notification sound:', error);
        reject(error);
      };
      
      // Play the sound
      audio.play()
        .catch(error => {
          // Most common error: browsers require user interaction before playing audio
          ('Error playing notification sound:', error);
          reject(error);
        });
    } catch (error) {
      ('Error setting up audio:', error);
      reject(error);
    }
  });
};

/**
 * Preloads all notification sounds for better performance
 * This loads the audio files but plays them silently to prepare them
 */
export const preloadNotificationSounds = () => {
  const soundTypes = ['reminder', 'task', 'default'];
  soundTypes.forEach(type => {
    try {
      // Create a new Audio object but don't play it
      const sounds = {
        reminder: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
        task: 'https://assets.mixkit.co/active_storage/sfx/1913/1913-preview.mp3',
        default: 'https://assets.mixkit.co/active_storage/sfx/1531/1531-preview.mp3'
      };
      
      const audio = new Audio(sounds[type]);
      audio.volume = 0; // Silent
      audio.preload = 'auto'; // Hint to browser to preload
      
      // Store in cache
      audioCache[type] = audio;
      
      (`Preloaded ${type} notification sound`);
    } catch (error) {
      (`Error preloading ${type} sound:`, error);
    }
  });
};