// components/SettingsModal.js
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserSettings, updateUserSettings } from '../../api/api';
import { setSoundSettings, setTimeSlotSettings } from '../../redux/settings/actions/settingsActions';
import { playNotificationSound } from '../../utils/audioUtils';

const ModalOverlay = ({ children, ...props }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}
    {...props}
  >
    {children}
  </div>
);

const ModalContent = ({ children }) => (
  <div
    style={{
      background: '#0a0a0a',
      padding: '2rem',
      borderRadius: '0.5rem',
      minWidth: '300px',
      maxWidth: '500px',
      color: '#d8d7f3d5',
    }}
  >
    {children}
  </div>
);

const SettingsGroup = ({ children, title }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    {title && <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>{title}</h3>}
    {children}
  </div>
);

const HoursGrid = ({ children }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
      gap: '0.5rem',
    }}
  >
    {children}
  </div>
);

const Button = ({ children, ...props }) => (
  <button
    style={{
      padding: '0.5rem 1rem',
      borderRadius: '0.25rem',
      border: 'none',
      cursor: 'pointer',
      background: '#333',
      color: '#fff',
      marginLeft: '0.5rem',
    }}
    {...props}
  >
    {children}
  </button>
);

const TabButton = ({ active, children, ...props }) => (
  <button
    style={{
      padding: '0.5rem 1rem',
      borderRadius: '0.25rem 0.25rem 0 0',
      border: 'none',
      borderBottom: active ? '2px solid #6b63ff' : '2px solid transparent',
      cursor: 'pointer',
      background: active ? '#1a1a1a' : '#0a0a0a',
      color: active ? '#fff' : '#7a7a7a',
      marginRight: '0.5rem',
    }}
    {...props}
  >
    {children}
  </button>
);

const SettingsModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startHour, setStartHour] = useState('12:00 AM');
  const [endHour, setEndHour] = useState('11:00 PM');
  const [hiddenHours, setHiddenHours] = useState([]);
  const [activeTab, setActiveTab] = useState('time'); // 'time' or 'sound'
  
  // Sound settings
  const soundSettings = useSelector(state => state.settings?.soundSettings || {
    enabled: true,
    volume: 0.7
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.7);
  
  const allHours = [
      '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM',
      '05:00 AM', '06:00 AM', '07:00 AM',
      '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
      '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM',
      '11:00 PM'
  ];

  useEffect(() => {
    const loadSettings = async () => {
      if (!open) return;
      
      setLoading(true);
      setError(null);
      try {
        const settings = await getUserSettings();
        ('Loaded settings:', settings);
        setStartHour(settings.start_hour);
        setEndHour(settings.end_hour);
        setHiddenHours(settings.hidden_hours || []);
        
        // Update Redux when settings are loaded
        dispatch(setTimeSlotSettings(settings));
      } catch (err) {
        ('Error loading settings:', err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    
    // Load sound settings from Redux state
    if (soundSettings) {
      setSoundEnabled(soundSettings.enabled);
      setVolume(soundSettings.volume);
    }
    
    loadSettings();
  }, [open, dispatch, soundSettings]);

  const handleSave = async () => {
    setError(null);
    try {
      const settings = {
        start_hour: startHour,
        end_hour: endHour,
        hidden_hours: hiddenHours
      };
  
      await updateUserSettings(settings);
      
      // Dispatch the settings update to Redux
      dispatch(setTimeSlotSettings(settings));
      
      // Dispatch sound settings update to Redux
      dispatch(setSoundSettings({
        enabled: soundEnabled,
        volume: volume
      }));
      
      // Log to verify the dispatch
      ('Dispatching settings update:', settings);
      
      onClose();
    } catch (err) {
      ('Error saving settings:', err);
      setError('Failed to save settings');
    }
  };
  
  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };
  
  const handleTestSound = async (type) => {
    if (!soundEnabled) return;
    
    try {
      await playNotificationSound(type, volume);
    } catch (error) {
      ('Error playing test sound:', error);
      setError('Failed to play test sound. Your browser may block audio playback.');
    }
  };

  if (!open) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Settings</h2>
        
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #333' }}>
          <TabButton 
            active={activeTab === 'time'} 
            onClick={() => setActiveTab('time')}
          >
            Time Slots
          </TabButton>
          <TabButton 
            active={activeTab === 'sound'} 
            onClick={() => setActiveTab('sound')}
          >
            Sound
          </TabButton>
        </div>
        
        {error && (
          <div style={{
            background: 'rgba(255, 0, 0, 0.1)',
            color: '#ff6b6b',
            padding: '0.75rem',
            borderRadius: '0.25rem',
            marginBottom: '1rem',
          }}>
            {error}
          </div>
        )}
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading settings...</div>
        ) : (
          <>
            {activeTab === 'time' && (
              <>
                <SettingsGroup>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Start Hour:</label>
                  <select 
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      background: '#1a1a1a',
                      color: '#d8d7f3d5',
                      border: '1px solid #333',
                    }}
                  >
                    {allHours.map(hour => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                </SettingsGroup>

                <SettingsGroup>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>End Hour:</label>
                  <select 
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      background: '#1a1a1a',
                      color: '#d8d7f3d5',
                      border: '1px solid #333',
                    }}
                  >
                    {allHours.map(hour => (
                      <option key={hour} value={hour}>{hour}</option>
                    ))}
                  </select>
                </SettingsGroup>

                <SettingsGroup>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Hidden Hours:</label>
                  <HoursGrid>
                    {allHours.map(hour => (
                      <label key={hour} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={hiddenHours.includes(hour)}
                          onChange={() => {
                            if (hiddenHours.includes(hour)) {
                              setHiddenHours(prev => prev.filter(h => h !== hour));
                            } else {
                              setHiddenHours(prev => [...prev, hour]);
                            }
                          }}
                          style={{ width: '1rem', height: '1rem' }}
                        />
                        {hour}
                      </label>
                    ))}
                  </HoursGrid>
                </SettingsGroup>
              </>
            )}

            {activeTab === 'sound' && (
              <>
                <SettingsGroup title="Sound Notifications">
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={handleToggleSound}
                        style={{ width: '1rem', height: '1rem' }}
                      />
                      Enable sound notifications
                    </label>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem', opacity: soundEnabled ? 1 : 0.5 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      Volume: {Math.round(volume * 100)}%
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem' }}>0%</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={handleVolumeChange}
                        disabled={!soundEnabled}
                        style={{
                          flex: 1,
                          height: '6px',
                          WebkitAppearance: 'none',
                          appearance: 'none',
                          backgroundColor: '#333',
                          borderRadius: '3px',
                          outline: 'none',
                        }}
                      />
                      <span style={{ fontSize: '0.8rem' }}>100%</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => handleTestSound('reminder')}
                      disabled={!soundEnabled}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: soundEnabled ? 'pointer' : 'not-allowed',
                        backgroundColor: soundEnabled ? '#3b82f6' : '#555',
                        color: '#fff',
                        opacity: soundEnabled ? 1 : 0.7,
                      }}
                    >
                      Test Reminder Sound
                    </button>
                    <button
                      onClick={() => handleTestSound('task')}
                      disabled={!soundEnabled}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: soundEnabled ? 'pointer' : 'not-allowed',
                        backgroundColor: soundEnabled ? '#10b981' : '#555',
                        color: '#fff',
                        opacity: soundEnabled ? 1 : 0.7,
                      }}
                    >
                      Test Task Sound
                    </button>
                  </div>
                  
                  {!soundEnabled && (
                    <div style={{ 
                      marginTop: '1rem',
                      padding: '0.5rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      borderLeft: '3px solid #3b82f6',
                      borderRadius: '0.25rem',
                      fontSize: '0.9rem',
                    }}>
                      Sound notifications are currently disabled. Enable them to hear audio alerts for your reminders and tasks.
                    </div>
                  )}
                </SettingsGroup>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <Button onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default SettingsModal;