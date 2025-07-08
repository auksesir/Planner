import React, { lazy, Suspense, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import '../styles/pages/Home.css';

/**
 * PERFORMANCE OPTIMIZATION STRATEGY
 * 
 * This component implements several performance optimizations:
 * 1. Lazy Loading: Heavy components are loaded only when needed
 * 2. LCP Optimization: Critical content renders immediately for better Core Web Vitals
 * 3. Component Preloading: Non-critical components are preloaded after initial render
 * 4. Memoization: Expensive calculations and components are memoized
 * 5. Conditional Rendering: Components only render when necessary
 */

// ==================== LAZY LOADED COMPONENTS ====================

// Lazy load heavy components that aren't needed for LCP (Largest Contentful Paint)
// These components are loaded asynchronously to improve initial page load performance
const CombinedSphere = lazy(() => import('../components/planning_utilities/CombinedSphere'));
const CurrentDayPlanner = lazy(() => import('../components/planning_visualisation/CurrentDayPlanner'));

// ==================== MEMOIZED SUBCOMPONENTS ====================

/**
 * LCPText Component
 * 
 * Lightweight fallback component optimized for LCP (Largest Contentful Paint).
 * This renders immediately without waiting for heavy components to load.
 * Displays either the current task name or a default motivational message.
 * 
 * Memoized to prevent unnecessary re-renders when parent re-renders.
 * 
 * @param {Object} currentTask - The currently active task from Redux state
 */
const LCPText = React.memo(({ currentTask }) => (
  <p className="text">
    {currentTask ? currentTask.name : 'Present is a Gift'}
  </p>
));

/**
 * SphereContainer Component
 * 
 * Manages the display logic for different sphere visualizations based on application state.
 * Uses conditional rendering to show the appropriate sphere component or placeholder.
 * 
 * Memoized to prevent unnecessary re-renders and optimize performance.
 * Uses useMemo hooks for expensive boolean calculations.
 * 
 * @param {Object} currentTask - Currently active task
 * @param {boolean} isPomodoroActive - Whether Pomodoro timer is running
 * @param {boolean} showTaskTimer - Whether to show task timer in sphere
 */
const SphereContainer = React.memo(({ 
  currentTask, 
  isPomodoroActive, 
  showTaskTimer 
}) => {
  // Memoized calculation: Show task timer when there's a current task AND
  // either no Pomodoro is active OR Pomodoro is active but task timer should be shown
  const shouldShowTaskTimer = useMemo(() => 
    currentTask && (!isPomodoroActive || (isPomodoroActive && showTaskTimer)),
    [currentTask, isPomodoroActive, showTaskTimer]
  );
  
  // Memoized calculation: Show default sphere when no task is active and no Pomodoro is running
  const shouldShowDefaultSphere = useMemo(() => 
    !currentTask && !isPomodoroActive,
    [currentTask, isPomodoroActive]
  );

  return (
    <div className="sphere-container">
      {/* Task Timer Sphere - Shows when a task is active */}
      {shouldShowTaskTimer && (
        <Suspense fallback={<div className="sphere-placeholder" />}>
          <CombinedSphere currentTask={currentTask} />
        </Suspense>
      )}
      
      {/* Default Sphere - Shows when no task or Pomodoro is active */}
      {shouldShowDefaultSphere && (
        <Suspense fallback={<div className="sphere-placeholder" />}>
          <div className="sphere" />
        </Suspense>
      )}
    </div>
  );
});

// ==================== MAIN COMPONENT ====================

/**
 * Home Component
 * 
 * The main landing page component that serves as the central hub for task management.
 * Implements performance optimizations including lazy loading, component preloading,
 * and LCP optimization for better user experience and Core Web Vitals scores.
 * 
 * Features:
 * - Performance-optimized rendering with lazy loading
 * - Dynamic sphere visualization based on task/Pomodoro state
 * - Integrated current day planner
 * - Component preloading for smoother user interactions
 * - Redux integration for global state management
 * 
 * @param {Object} currentTask - Currently active task from Redux state
 * @param {Function} setTaskToEdit - Callback to set a task for editing
 * @param {Function} setReminderToEdit - Callback to set a reminder for editing
 * @param {boolean} isPomodoroActive - Whether Pomodoro timer is currently running
 * @param {boolean} showTaskTimer - Whether to display task timer in sphere visualization
 */
const Home = ({ 
  currentTask, 
  setTaskToEdit, 
  setReminderToEdit, 
  isPomodoroActive,
  showTaskTimer 
}) => {
  
  // ==================== PERFORMANCE OPTIMIZATION ====================
  
  /**
   * Component Preloading Strategy
   * 
   * Preloads heavy components after the initial render completes.
   * This improves perceived performance by loading components in the background
   * while the user is viewing the initial content.
   * 
   * Uses a short timeout to ensure this runs after the initial render cycle.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      // Preload heavy components for faster subsequent interactions
      import('../components/planning_utilities/CombinedSphere');
      import('../components/planning_visualisation/CurrentDayPlanner');
    }, 100); // Small delay to avoid blocking initial render
    
    // Cleanup timeout on component unmount
    return () => clearTimeout(timer);
  }, []);

  // ==================== RENDER ====================

  return (
    <div className="home-container">
      
      {/* ==================== HEADER SECTION ==================== */}
      {/* Critical content optimized for LCP - renders immediately */}
      <div className="header-section">
        {/* Lightweight text component for fast LCP */}
        <LCPText currentTask={currentTask} />
        
        {/* Memoized sphere container with conditional rendering */}
        <SphereContainer 
          currentTask={currentTask}
          isPomodoroActive={isPomodoroActive}
          showTaskTimer={showTaskTimer}
        />
      </div>
      
      {/* ==================== PLANNER SECTION ==================== */}
      {/* Non-critical content - lazy loaded for better performance */}
      <div className="planner-container">
        <Suspense fallback={
          // Loading state with skeleton to maintain layout stability
          <div className="planner-loading">
            <div className="loading-skeleton" />
          </div>
        }>
          {/* Current day planner - lazy loaded to improve initial page load */}
          <CurrentDayPlanner 
            setTaskToEdit={setTaskToEdit}
            setReminderToEdit={setReminderToEdit} 
          />
        </Suspense>
      </div>
    </div>
  );
};

// ==================== REDUX CONNECTION ====================

/**
 * Maps Redux state to component props
 * 
 * Connects the component to the global application state to access:
 * - currentTask: The currently active task for display and sphere logic
 * 
 * Note: Other props (isPomodoroActive, showTaskTimer) appear to come from parent components
 * rather than Redux state, suggesting they might be managed by different state systems.
 */
const mapStateToProps = (state) => ({
  currentTask: state.currentTask
});

export default connect(mapStateToProps)(Home);