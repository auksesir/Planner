import { ADD_TASK, CLEAR_ALL_TASKS, CLEAR_REMINDER, DELETE_TASK, SET_REMINDER, UPDATE_TASK } from './tasksActionsTypes';

export const addTask = (hour, task) => ({
    type: ADD_TASK,
    payload: { hour, task },
  });
  
  export const deleteTask = ({ taskId, startTime, endTime }) => ({
    type: DELETE_TASK,
    payload: { taskId, startTime,endTime }, // Payload includes the hour and taskId to identify the task to delete
  });


export const updateTask = (updatedTask) => ({
  type: UPDATE_TASK,
  payload: updatedTask,
});
  
// Task reminder actions
export const setReminder = (reminderInfo) => ({
  type: SET_REMINDER,
  payload: reminderInfo
});

export const clearReminder = (taskId) => ({
  type: CLEAR_REMINDER,
  payload: taskId
});

export const clearAllTasks = () => ({
  type: CLEAR_ALL_TASKS
});