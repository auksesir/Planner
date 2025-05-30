import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { getRemindersForDay, getTasksForDay } from '../../api/api';
import { setSelectedDayUI } from '../../redux/tasks/actions/selectedDayUIActions';
import '../../styles/components/planning_visualisation/MonthlyPlanner.css';
import {
  formatDate,
  getDaysInMonth,
  getMonthName,
  getMonths,
  getYears,
  groupItemsByTimeSlot
} from '../../utils/timeUtils';
import DailyPlanner from './DailyPlanner';

const MonthlyPlanner = ({ setTaskToEdit, setReminderToEdit }) => {
  // Local state for selected year, month, day, tasks, and reminders
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const dispatch = useDispatch();

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  const handleDayClick = async (day) => {
    const selectedDate = formatDate(selectedYear, selectedMonth, day);
    
    // Fetch tasks and reminders for the selected day
    const tasksForDay = await getTasksForDay(selectedDate);
    const remindersForDay = await getRemindersForDay(selectedDate);

    // Update state with the selected day, tasks, reminders, and dispatch to set UI day in Redux store
    setSelectedDay(selectedDate);
    setTasks(tasksForDay);
    setReminders(remindersForDay);
    dispatch(setSelectedDayUI(selectedDate));
  };


  // Group tasks and reminders by time slot for proper DailyPlanner formatting
  const groupedTasks = groupItemsByTimeSlot(tasks, 'startTime', 'endTime');
  const groupedReminders = groupItemsByTimeSlot(reminders, 'selectedTime', 'selectedTime');

  return (
    <div className="monthly-planner-container">
      <h1>{getMonthName(selectedMonth, selectedYear)}</h1>

      <div className="date-selectors">
        <label>
          Year:
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {getYears().map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label>
          Month:
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {getMonths().map((month) => (
              <option key={month} value={month}>
                {getMonthName(month, selectedYear)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="calendar-grid">
        <div className="day-label">Sun</div>
        <div className="day-label">Mon</div>
        <div className="day-label">Tue</div>
        <div className="day-label">Wed</div>
        <div className="day-label">Thu</div>
        <div className="day-label">Fri</div>
        <div className="day-label">Sat</div>

        {Array.from({ length: firstDayOfMonth }, (_, index) => (
          <div key={`empty-${index}`} className="empty-day"></div>
        ))}

        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1;
          const dayDate = formatDate(selectedYear, selectedMonth, day);
          return (
            <div
              key={day}
              className={`calendar-day ${
                selectedDay === dayDate ? 'selected' : ''
              }`}
              onClick={() => handleDayClick(day)}
            >
              {day}
            </div>
          );
        })}
      </div>

      {selectedDay && (
        <div className="daily-planner-container">
          <DailyPlanner
            day={selectedDay}
            tasks={groupedTasks}
            reminders={groupedReminders}
            isCurrentDay={false} 
            setTaskToEdit={setTaskToEdit}
            setReminderToEdit={setReminderToEdit}
            DailyPlanner context="monthly"
          />
        </div>
      )}
    </div>
  );
};

export default MonthlyPlanner;