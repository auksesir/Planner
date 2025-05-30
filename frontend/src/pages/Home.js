import React, { lazy, Suspense, useEffect, useMemo } from 'react';
import { connect } from 'react-redux';
import '../styles/pages/Home.css';


// Lazy load heavy components that aren't needed for LCP
const CombinedSphere = lazy(() => import('../components/planning_utilities/CombinedSphere'));
const CurrentDayPlanner = lazy(() => import('../components/planning_visualisation/CurrentDayPlanner'));

// Lightweight fallback component for initial render
const LCPText = React.memo(({ currentTask }) => (
  <p className="text">
    {currentTask ? currentTask.name : 'Present is a Gift'}
  </p>
));

const SphereContainer = React.memo(({ 
  currentTask, 
  isPomodoroActive, 
  showTaskTimer 
}) => {
  const shouldShowTaskTimer = useMemo(() => 
    currentTask && (!isPomodoroActive || (isPomodoroActive && showTaskTimer)),
    [currentTask, isPomodoroActive, showTaskTimer]
  );
  
  const shouldShowDefaultSphere = useMemo(() => 
    !currentTask && !isPomodoroActive,
    [currentTask, isPomodoroActive]
  );

  return (
    <div className="sphere-container">
      {shouldShowTaskTimer && (
        <Suspense fallback={<div className="sphere-placeholder" />}>
          <CombinedSphere currentTask={currentTask} />
        </Suspense>
      )}
      
      {shouldShowDefaultSphere && (
        <Suspense fallback={<div className="sphere-placeholder" />}>
          <div className="sphere" />
        </Suspense>
      )}
    </div>
  );
});

const Home = ({ 
  currentTask, 
  setTaskToEdit, 
  setReminderToEdit, 
  isPomodoroActive,
  showTaskTimer 
}) => {
  // Preload components after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      import('../components/planning_utilities/CombinedSphere');
      import('../components/planning_visualisation/CurrentDayPlanner');
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="home-container">
      {/* Header section - optimized for LCP */}
      <div className="header-section">
        <LCPText currentTask={currentTask} />
        
        <SphereContainer 
          currentTask={currentTask}
          isPomodoroActive={isPomodoroActive}
          showTaskTimer={showTaskTimer}
        />
      </div>
      
      {/* Planner section - lazy loaded */}
      <div className="planner-container">
        <Suspense fallback={
          <div className="planner-loading">
            <div className="loading-skeleton" />
          </div>
        }>
          <CurrentDayPlanner 
            setTaskToEdit={setTaskToEdit}
            setReminderToEdit={setReminderToEdit} 
          />
        </Suspense>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  currentTask: state.currentTask
});

export default connect(mapStateToProps)(Home);