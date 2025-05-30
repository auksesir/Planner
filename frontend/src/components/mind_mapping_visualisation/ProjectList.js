import '../../styles/components/mind_mapping_visualisation/ProjectList.css';

const ProjectList = ({ projects = [], selectedProject, onSelectProject, onDeleteProject, onCreateProject }) => {
  return (
    <div className="project-list">
      <div className="project-list-header">
        <h2 className="project-list-title">Your Projects</h2>
        <button 
          className="add-project-button"
          onClick={onCreateProject}
          title="Create new project"
        >
          +
        </button>
      </div>
      <div className="project-items">
        {projects.map(project => (
          <div 
            key={project.id}
            className={`project-item ${selectedProject?.id === project.id ? 'project-item-selected' : ''}`}
          >
            <button 
              className="project-item-button"
              onClick={() => onSelectProject(project.id)}
            >
              <div className="project-item-name">{project.name}</div>
              
              <div className="project-item-meta">
                {/* Completion percentage info */}
                <div className="project-item-completion">
                  <div className="project-item-progress-bar">
                    <div 
                      className="project-item-progress-fill" 
                      style={{ width: `${project.completion}%` }}
                    ></div>
                  </div>
                  <span className="project-item-percentage">{project.completion}%</span>
                </div>
                
                {/* Days remaining info */}
                <div className={`project-item-days ${project.isOverdue ? 'overdue' : ''}`}>
                  {project.isOverdue 
                    ? `${Math.abs(project.daysRemaining)} days overdue` 
                    : `${project.daysRemaining} days left`}
                </div>
              </div>
            </button>
            
            <button 
              className="project-item-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteProject(project.id);
              }}
              title="Delete project"
            >
              ✕
            </button>
          </div>
        ))}
        
        {projects.length === 0 && (
          <div className="no-projects-message">
            No projects yet. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;