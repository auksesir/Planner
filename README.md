The Planner - Neurodivergent-Friendly Productivity Application A minimalistic productivity application specifically designed for neurodivergent users, featuring three separate core tools: daily task management, project mind mapping, and reminder scheduling. Built with React and Node.js, this system emphasizes visual feedback, duration-based timing, and cognitive load reduction.

✨ Core Features ✅ Daily Task Management

Duration-Focused Design: Emphasizes how much time is left rather than start/end times No Task Overlap: Prevents scheduling conflicts with intelligent overlap detection Visual Current Task Display: Shows active task with visual timer and duration Time Slot Organization: Tasks organized by time slots for clear daily structure Recurring Task Support: Flexible repeat patterns with skip date functionality Smart Task Validation: Ensures data integrity and prevents conflicts

🗺️ Project Mind Mapping

Visual Project Planning: Interactive mind maps for long-term project organization Hierarchical Node Structure: Parent-child relationships with drag-and-drop positioning Automatic Completion Tracking: Progress automatically propagates up the hierarchy Duration Visualization: Visual display of subtask durations and time remaining Project Deadline Management: Track project milestones and deadlines Real-time Synchronization: Live updates across the mind map interface

📅 Calendar Views

Monthly and Weekly Views: Access tasks through intuitive calendar interfaces Current Day Highlighting: Clear visual indication of today's schedule Task Duration Display: Visual representation of task lengths in calendar view Navigation Between Days: Easy switching between different dates

⏱️ Visual Pomodoro Timer

Duration-Focused Design: Emphasizes concentration and break durations Visual Timer Representation: Concrete visual feedback for abstract time concepts Task Integration: Can work alongside task timers or independently Customizable Sessions: Adjustable work and break durations Audio-Visual Notifications: Clear session completion indicators

🔔 Reminder System

Independent Scheduling: Separate from tasks for flexible notification management Visual and Audio Alerts: Multiple notification types for accessibility Recurring Reminders: Flexible repeat patterns and scheduling options Reminder Management: Easy creation, editing, and deletion

🛠️ Technology Stack

Frontend: React.js with modern hooks and components Backend: Node.js with Express.js Database: SQLite for data persistence Testing: Comprehensive test suite with Jest Styling: CSS with modular component styling API: RESTful API design with proper validation

📁 Project Structure ├── src/ │ ├── components/ │ │ ├── input_components/ # Task/reminder input interfaces │ │ ├── planning_utilities/ # Pomodoro timer, settings, schedulers │ │ ├── planning_visualisation/ # Calendar views, daily planner │ │ ├── mind_mapping_utilities/ # Project creation dialogs, confirmations │ │ └── mind_mapping_visualisation/ # Mind map rendering, project lists │ ├── pages/ │ │ ├── Home.js # Main dashboard │ │ ├── Planner.js # Task management interface │ │ └── Projects.js # Mind mapping interface │ ├── api/ │ │ ├── tasksApi.js # Task management endpoints │ │ ├── projectsApi.js # Project mind mapping endpoints │ │ ├── remindersApi.js # Reminder system endpoints │ │ ├── pomodoroApi.js # Timer functionality endpoints │ │ └── api.js # Centralized API exports │ ├── redux/ # State management for tasks and reminders │ ├── styles/ # Component-specific styling │ ├── utils/ # Shared utilities and helpers │ └── validation/ │ └── validation.js # Input validation rules ├── tests/ │ ├── components/ # Component testing │ ├── integration/ # Integration testing │ └── api/ # API endpoint testing └── docs/ └── Final Project.pdf # Complete project documentation 🚀 Getting Started Prerequisites

Node.js (v14 or higher) npm or yarn package manager

Installation

Clone the repository bashgit clone [your-repository-url] cd [your-project-name]

Install dependencies bashnpm install

or
yarn install

Set up the database bashnpm run setup-db

Start the development server bashnpm start

or
yarn start

Run tests bashnpm test

or
yarn test

The application will be available at http://localhost:3000 📖 Usage Guide Daily Task Management

Navigate to the Planner page Create tasks with specific durations and time slots View tasks in daily, weekly, or monthly calendar views Use the visual current task display to track active work Start Pomodoro sessions for focused concentration periods System prevents overlapping tasks automatically

Project Mind Mapping

Navigate to the Projects page Click "New Project" to create a long-term project Add nodes to represent project components and subtasks Drag and drop nodes to organize your project visually Create hierarchical relationships between project elements Track overall project completion through visual feedback

Managing Reminders

Create independent reminders for important events Set flexible repeat patterns for recurring notifications Receive visual and audio alerts when reminders trigger Manage reminders separately from daily tasks

Visual Timer Features

Use the current task display for duration-focused work Start Pomodoro sessions for structured focus periods Switch between task timers and Pomodoro timers as needed Benefit from visual time representation throughout the interface

🧪 Testing The project includes comprehensive testing coverage: bash# Run all tests npm test

Run tests with coverage
npm run test:coverage

Run tests in watch mode
npm run test:watch Test Coverage Areas

Task Management: CRUD operations, overlap detection, recurring patterns Project System: Node hierarchy, completion calculation, mind map interactions Reminder System: Scheduling, repeat patterns, notification handling API Integration: All endpoint functionality and validation Component Functionality: User interface interactions and state management Cross-System Integration: Component communication and state synchronization

📋 API Documentation Task Management Endpoints

GET /api/tasks - Get all tasks GET /api/tasks/:id - Get specific task GET /api/tasks/day/:date - Get tasks for specific day POST /api/tasks - Create new task PUT /api/tasks/:id - Update task DELETE /api/tasks/:id - Delete task PUT /api/tasks/:id/reminder - Set task reminder DELETE /api/tasks/:id/reminder - Clear task reminder

Project Management Endpoints

GET /api/projects - Get all projects POST /api/projects - Create new project GET /api/projects/:id - Get project with nodes PUT /api/projects/:id/deadline - Update project deadline DELETE /api/projects/:id - Delete project

Project Node Endpoints

POST /api/projects/:projectId/nodes - Add node to project POST /api/projects/:projectId/nodes/:parentId/subnodes - Add subnode PUT /api/nodes/:nodeId/position - Update node position PUT /api/nodes/:nodeId/completion - Update completion percentage PUT /api/nodes/:nodeId/parent - Update node parent relationship DELETE /api/nodes/:nodeId - Delete node

Reminder Endpoints

GET /api/reminders - Get all reminders GET /api/reminders/:id - Get specific reminder GET /api/reminders/day/:date - Get reminders for specific day POST /api/reminders - Create new reminder PUT /api/reminders/:id - Update reminder DELETE /api/reminders/:id - Delete reminder

Pomodoro Timer Endpoints

GET /api/pomodoro/settings - Get timer settings PUT /api/pomodoro/settings - Update timer settings POST /api/pomodoro/sessions - Record completed session GET /api/pomodoro/stats - Get usage statistics

🎯 Key Features in Detail Duration-Focused Task Design The application emphasizes:

Visual time representation over abstract clock times Task duration rather than start/end time calculations Time remaining display for active tasks Continuous visual feedback to reduce cognitive load

Interactive Mind Map Visualization The project mind mapping provides:

Real-time visual feedback for project organization Drag-and-drop node positioning for intuitive planning Hierarchical completion tracking with automatic propagation Visual duration display for subtasks and project components Dynamic connection rendering between related elements

Neurodivergent-Friendly Design

Minimalistic interface to reduce cognitive overload Clear visual hierarchy without complex navigation Separation of concerns with distinct tools for different purposes Visual timer representations making abstract time concepts concrete Immediate temporal awareness through current task display

Advanced Task Management

Intelligent overlap prevention ensures scheduling integrity Flexible recurring patterns with skip date functionality Visual calendar integration for monthly and weekly planning Real-time task updates with automatic current task detection

🤝 Contributing

Fork the repository Create a feature branch (git checkout -b feature/amazing-feature) Commit your changes (git commit -m 'Add amazing feature') Push to the branch (git push origin feature/amazing-feature) Open a Pull Request

Development Guidelines

Follow React best practices and hooks patterns Write comprehensive tests for new features Maintain code documentation and comments Follow the existing code style and structure

📝 License This project is licensed under the MIT License - see the LICENSE file for details.