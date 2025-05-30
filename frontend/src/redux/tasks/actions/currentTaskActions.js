import { format } from 'date-fns';

export const setCurrentTask = (task) => {
  // If task is null or undefined, return action with null payload
  if (task === null || task === undefined) {
    return {
      type: 'SET_CURRENT_TASK',
      payload: null
    };
  }

  // Make a copy of the task to avoid modifying the original
  const serializedTask = { ...task };
  
  // Safely handle selectedDay if it exists
  if (serializedTask.selectedDay) {
    serializedTask.selectedDay = serializedTask.selectedDay instanceof Date 
      ? format(serializedTask.selectedDay, 'yyyy-MM-dd') 
      : serializedTask.selectedDay;
  }

  return {
    type: 'SET_CURRENT_TASK',
    payload: serializedTask
  };
};
  