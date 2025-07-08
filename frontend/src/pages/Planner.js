// Planner.js
import { Link, Route, Routes } from 'react-router-dom';
import MonthlyPlanner from '../components/planning_visualisation/MonthlyPlanner';
import WeeklyPlanner from '../components/planning_visualisation/WeeklyPlanner';
import '../styles/pages/Planner.css';

/**
 * Planner Component
 * 
 * A top-level routing container that provides navigation between different planning views.
 * This component serves as the main planner interface, allowing users to switch between
 * weekly and monthly planning perspectives within a single cohesive interface.
 * 
 * Features:
 * - Tab-based navigation between planning views
 * - Consistent callback prop forwarding to child components
 * - React Router integration for deep linking and browser navigation
 * - Shared styling and layout for all planning interfaces
 * 
 * URL Structure:
 * - /planner/weekly - Weekly planning view with grid and single-day modes
 * - /planner/monthly - Monthly calendar view with event management
 * 
 * @param {Function} setTaskToEdit - Callback function to set a task for editing
 *                                   Passed down to all child planning components
 * @param {Function} setReminderToEdit - Callback function to set a reminder for editing
 *                                       Passed down to all child planning components
 */
const Planner = ({ setTaskToEdit, setReminderToEdit }) => {
  return (
    <div className="planner-container">
      
      {/* ==================== NAVIGATION TABS ==================== */}
      {/* 
        Navigation bar providing tab-like interface for switching between planning views.
        Uses React Router Link components for proper routing and browser history management.
        Each link corresponds to a specific planning perspective.
      */}
      <nav className="planner-nav">
        {/* Weekly Planner Navigation Link */}
        <Link to="/planner/weekly" className="planner-link">
          Weekly Planner
        </Link>
        
        {/* Monthly Planner Navigation Link */}
        <Link to="/planner/monthly" className="planner-link">
          Monthly Planner
        </Link>
      </nav>
      
      {/* ==================== ROUTE DEFINITIONS ==================== */}
      {/* 
        React Router Routes configuration for different planning views.
        Each route renders a specific planning component with consistent props.
        
        Route Structure:
        - All routes are relative to the parent /planner path
        - Props are passed through to maintain editing functionality
        - Components are responsible for their own data management and state
      */}
      <Routes>
        {/* Weekly Planning Route */}
        {/* 
          Renders WeeklyPlanner component at /planner/weekly
          Provides dual-view functionality (grid and single-day views)
          Includes dynamic height calculations and event management
        */}
        <Route path="weekly" element={
          <WeeklyPlanner 
            setTaskToEdit={setTaskToEdit}           // Forward task editing callback
            setReminderToEdit={setReminderToEdit}   // Forward reminder editing callback
          />
        } />
        
        {/* Monthly Planning Route */}
        {/* 
          Renders MonthlyPlanner component at /planner/monthly
          Provides calendar-style monthly view with event overview
          Includes month navigation and event density visualization
        */}
        <Route path="monthly" element={
          <MonthlyPlanner 
            setTaskToEdit={setTaskToEdit}           // Forward task editing callback
            setReminderToEdit={setReminderToEdit}   // Forward reminder editing callback
          />
        } />
      </Routes>
    </div>
  );
};

export default Planner;