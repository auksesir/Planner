// Planner.js
import { Link, Route, Routes } from 'react-router-dom';
import MonthlyPlanner from '../components/planning_visualisation/MonthlyPlanner';
import WeeklyPlanner from '../components/planning_visualisation/WeeklyPlanner';
import '../styles/pages/Planner.css';

const Planner = ({ setTaskToEdit, setReminderToEdit }) => {
  return (
    <div className="planner-container">
      <nav className="planner-nav">
        <Link to="/planner/weekly" className="planner-link">
          Weekly Planner
        </Link>
        <Link to="/planner/monthly" className="planner-link" >
          Monthly Planner
        </Link>
      </nav>
      <Routes>
        <Route path="weekly" element={
          <WeeklyPlanner 
            setTaskToEdit={setTaskToEdit}
            setReminderToEdit={setReminderToEdit}
          />
        } />
        <Route path="monthly" element={
          <MonthlyPlanner 
            setTaskToEdit={setTaskToEdit}
            setReminderToEdit={setReminderToEdit}
          />
        } />
      </Routes>
    </div>
  );
};

export default Planner;