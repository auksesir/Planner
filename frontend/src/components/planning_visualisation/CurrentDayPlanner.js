import { useEffect } from 'react';
import { connect, useDispatch } from 'react-redux';
import { setSelectedDayUI } from '../../redux/tasks/actions/selectedDayUIActions';
import DailyPlanner from './DailyPlanner';

const CurrentDayPlanner = ({ 
  currentDay, 
  currentDayTasks, 
  currentDayReminders, 
  setTaskToEdit,
  setReminderToEdit  // Add setReminderToEdit to props
}) => {
  const dispatch = useDispatch();
 
  useEffect(() => {
    dispatch(setSelectedDayUI(currentDay));
  }, [dispatch, currentDay]);

  return (
    <div>
      <DailyPlanner 
        day={currentDay} 
        tasks={currentDayTasks} 
        reminders={currentDayReminders} 
        isCurrentDay={true}
        setTaskToEdit={setTaskToEdit}
        setReminderToEdit={setReminderToEdit} 
        context="home" 
      />
    </div>
  );
};

const mapStateToProps = (state) => ({
  currentDay: state.currentDay,
  currentDayTasks: state.tasks,
  currentDayReminders: state.reminders,
});

export default connect(mapStateToProps)(CurrentDayPlanner);