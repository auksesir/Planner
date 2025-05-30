// src/services/projectService.js

class ProjectService {
    constructor(db) {
        this.db = db;
    }

    async getAllProjects() {
        try {
            const projects = await this.db.all(`
                SELECT 
                    p.id, 
                    p.name, 
                    p.start_date,
                    p.end_date,
                    p.deadline,
                    p.created_at,
                    COUNT(DISTINCT pn.id) as node_count,
                    COALESCE(AVG(pn.completion), 0) as avg_completion
                FROM projects p
                LEFT JOIN project_nodes pn ON p.id = pn.project_id
                GROUP BY p.id, p.name, p.start_date, p.end_date, p.deadline, p.created_at
                ORDER BY p.created_at DESC
            `);
            
            return projects;
        } catch (error) {
            console.error('Error getting all projects:', error);
            throw new Error('Failed to get projects');
        }
    }

    async createProject(projectData) {
        try {
            const { name, description, startDate, endDate, deadline } = projectData;
            
            console.log('Creating project with data:', { name, description, startDate, endDate, deadline });
            
            // Check if description column exists, if not, skip it
            // First, let's try with just the basic required columns that should exist
            const result = await this.db.run(
                'INSERT INTO projects (name, start_date, end_date, deadline) VALUES (?, ?, ?, ?)',
                [name, startDate, endDate, deadline || endDate]
            );
            
            console.log('Project created with ID:', result.lastID);
            
            return {
                id: result.lastID,
                name,
                start_date: startDate,
                end_date: endDate,
                deadline: deadline || endDate,
                created_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error creating project:', error);
            console.error('SQL Error details:', error.message);
            throw new Error('Failed to create project: ' + error.message);
        }
    }

    async getProjectWithNodes(projectId) {
        try {
            const project = await this.db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
            if (!project) {
                throw new Error('Project not found');
            }
            
            const nodes = await this.db.all(`
                SELECT 
                    pn.*,
                    (SELECT COUNT(*) FROM project_nodes WHERE parent_node_id = pn.id) as subnode_count
                FROM project_nodes pn
                WHERE pn.project_id = ?
                ORDER BY pn.created_at ASC
            `, [projectId]);

            return {
                project,
                nodes
            };
        } catch (error) {
            console.error('Error getting project with nodes:', error);
            throw error;
        }
    }
  
    async updateProjectDeadline(projectId, deadline) {
      try {
        await this.db.run(
          'UPDATE projects SET deadline = ?, end_date = ? WHERE id = ?',
          [deadline, deadline, projectId]
        );
        
        return {
          id: parseInt(projectId),
          deadline
        };
      } catch (error) {
        console.error('Error updating project deadline:', error);
        throw new Error('Failed to update project deadline');
      }
    }
  
    async deleteProject(projectId) {
      try {
        // Delete nodes first (foreign key constraint)
        await this.db.run('DELETE FROM project_nodes WHERE project_id = ?', [projectId]);
        // Then delete the project
        await this.db.run('DELETE FROM projects WHERE id = ?', [projectId]);
        
        return { id: parseInt(projectId) };
      } catch (error) {
        console.error('Error deleting project:', error);
        throw new Error('Failed to delete project');
      }
    }
  
    // Node methods
    async addNode(projectId, nodeData) {
      try {
        const { name, parentNodeId, positionX, positionY, completion, deadline, weight } = nodeData;
        
        console.log('Adding node with data:', nodeData);
        
        // Use only the columns that exist in your current schema
        const result = await this.db.run(
          `INSERT INTO project_nodes 
          (project_id, name, parent_node_id, position_x, position_y, completion, deadline)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            projectId, 
            name, 
            parentNodeId || null, 
            positionX || 100, 
            positionY || 100,
            completion || 0,
            deadline || null
          ]
        );
        
        if (parentNodeId) {
          await this.updateParentChain(parentNodeId);
        }
        
        const newNode = {
          id: result.lastID,
          project_id: parseInt(projectId),
          name,
          parent_node_id: parentNodeId || null,
          position_x: positionX || 100,
          position_y: positionY || 100,
          completion: completion || 0,
          deadline: deadline || null,
          created_at: new Date().toISOString()
        };
        
        console.log('Node created:', newNode);
        return newNode;
      } catch (error) {
        console.error('Error adding node:', error);
        console.error('SQL Error details:', error.message);
        throw new Error('Failed to add node: ' + error.message);
      }
    }

    // Fixed addSubnode method
    async addSubnode(projectId, parentNodeId, nodeData) {
      try {
        const { name, positionX, positionY, completion, deadline } = nodeData;
        
        console.log('Adding subnode with data:', nodeData);
        
        // Use only the columns that exist in your current schema
        const result = await this.db.run(
          `INSERT INTO project_nodes 
          (project_id, name, parent_node_id, position_x, position_y, completion, deadline)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            projectId, 
            name, 
            parentNodeId, 
            positionX || 100, 
            positionY || 100,
            completion || 0,
            deadline || null
          ]
        );

        await this.updateParentChain(parentNodeId);

        const newSubnode = {
          id: result.lastID,
          project_id: parseInt(projectId),
          name,
          parent_node_id: parseInt(parentNodeId),
          position_x: positionX || 100,
          position_y: positionY || 100,
          completion: completion || 0,
          deadline: deadline || null,
          created_at: new Date().toISOString()
        };
        
        console.log('Subnode created:', newSubnode);
        return newSubnode;
      } catch (error) {
        console.error('Error adding subnode:', error);
        console.error('SQL Error details:', error.message);
        throw new Error('Failed to add subnode: ' + error.message);
      }
    }
  
    async updateNodePosition(nodeId, positionX, positionY) {
      try {
        await this.db.run(
          'UPDATE project_nodes SET position_x = ?, position_y = ? WHERE id = ?',
          [positionX, positionY, nodeId]
        );
        
        return { 
          id: parseInt(nodeId),
          position_x: positionX,
          position_y: positionY
        };
      } catch (error) {
        console.error('Error updating node position:', error);
        throw new Error('Failed to update node position');
      }
    }
  
    async updateNode(nodeId, nodeData) {
      try {
        const { name, completion } = nodeData;
        
        const node = await this.db.get('SELECT id, parent_node_id FROM project_nodes WHERE id = ?', [nodeId]);
        if (!node) {
          throw new Error('Node not found');
        }

        // Build dynamic SQL based on provided fields and available columns
        const updates = [];
        const params = [];

        if (name !== undefined) {
          updates.push('name = ?');
          params.push(name);
        }
        if (completion !== undefined) {
          updates.push('completion = ?');
          params.push(completion);
        }

        if (updates.length > 0) {
          params.push(nodeId);
          await this.db.run(
            `UPDATE project_nodes SET ${updates.join(', ')} WHERE id = ?`,
            params
          );
        }
        
        if (node.parent_node_id) {
          await this.updateParentChain(node.parent_node_id);
        }
        
        return { 
          id: parseInt(nodeId),
          name,
          completion
        };
      } catch (error) {
        console.error('Error updating node:', error);
        throw error;
      }
    }
  
    async updateNodeCompletion(nodeId, completion) {
      try {
        const node = await this.db.get('SELECT id, parent_node_id, project_id FROM project_nodes WHERE id = ?', [nodeId]);
        if (!node) {
          throw new Error('Node not found');
        }
  
        // Validate completion percentage
        const completionValue = Math.min(Math.max(0, parseInt(completion, 10)), 100);
        
        // Update this node's completion
        await this.db.run(
          'UPDATE project_nodes SET completion = ? WHERE id = ?',
          [completionValue, nodeId]
        );
        
        // If setting to 100% or 0%, update all child nodes directly
        if (completionValue === 100 || completionValue === 0) {
          await this.updateAllChildren(nodeId, completionValue);
        }
        
        // Update all parent nodes directly
        if (node.parent_node_id) {
          await this.updateParentChain(node.parent_node_id);
        }
        
        return { 
          id: parseInt(nodeId),
          completion: completionValue
        };
      } catch (error) {
        console.error('Error updating node completion:', error);
        throw error;
      }
    }
  
    async updateNodeDeadline(nodeId, deadline) {
      try {
        await this.db.run(
          'UPDATE project_nodes SET deadline = ? WHERE id = ?',
          [deadline, nodeId]
        );
        
        return { 
          id: parseInt(nodeId),
          deadline
        };
      } catch (error) {
        console.error('Error updating node deadline:', error);
        throw new Error('Failed to update node deadline');
      }
    }
  
    async updateNodeParent(nodeId, parentNodeId) {
      try {
        const node = await this.db.get('SELECT id, parent_node_id FROM project_nodes WHERE id = ?', [nodeId]);
        if (!node) {
          throw new Error('Node not found');
        }
  
        const oldParentId = node.parent_node_id;
  
        await this.db.run(
          'UPDATE project_nodes SET parent_node_id = ? WHERE id = ?',
          [parentNodeId, nodeId]
        );
        
        if (oldParentId) {
          await this.updateParentChain(oldParentId);
        }
        
        if (parentNodeId) {
          await this.updateParentChain(parentNodeId);
        }
        
        return { 
          id: parseInt(nodeId),
          parent_node_id: parentNodeId
        };
      } catch (error) {
        console.error('Error updating node parent:', error);
        throw error;
      }
    }
  
    async updateNodeSize(nodeId, sizeData) {
      try {
        const { size, customWidth, customHeight } = sizeData;
        
        let sql = 'UPDATE project_nodes SET ';
        const params = [];
        const updates = [];
      
        if (size !== undefined) {
          updates.push('size = ?');
          params.push(size);
        }
      
        if (customWidth !== undefined) {
          updates.push('custom_width = ?');
          params.push(customWidth);
        }
      
        if (customHeight !== undefined) {
          updates.push('custom_height = ?');
          params.push(customHeight);
        }
      
        if (updates.length === 0) {
          return { id: parseInt(nodeId) };
        }

        sql += updates.join(', ') + ' WHERE id = ?';
        params.push(nodeId);
      
        await this.db.run(sql, params);
      
        return { 
          id: parseInt(nodeId),
          size,
          customWidth,
          customHeight
        };
      } catch (error) {
        console.error('Error updating node size:', error);
        throw new Error('Failed to update node size');
      }
    }
  
    async deleteNode(nodeId) {
      try {
        const node = await this.db.get('SELECT id, parent_node_id FROM project_nodes WHERE id = ?', [nodeId]);
        if (!node) {
          throw new Error('Node not found');
        }
  
        const parentNodeId = node.parent_node_id;
  
        // Delete this node and all its children recursively
        await this.deleteNodeAndChildren(nodeId);
        
        if (parentNodeId) {
          await this.updateParentChain(parentNodeId);
        }
        
        return { id: parseInt(nodeId) };
      } catch (error) {
        console.error('Error deleting node:', error);
        throw error;
      }
    }

    // Helper method to recursively delete a node and all its children
    async deleteNodeAndChildren(nodeId) {
      try {
        // First, get all children of this node
        const children = await this.db.all(
          'SELECT id FROM project_nodes WHERE parent_node_id = ?',
          [nodeId]
        );

        // Recursively delete all children first
        for (const child of children) {
          await this.deleteNodeAndChildren(child.id);
        }

        // Then delete this node
        await this.db.run('DELETE FROM project_nodes WHERE id = ?', [nodeId]);
      } catch (error) {
        console.error('Error in deleteNodeAndChildren:', error);
        throw error;
      }
    }
  
    // Helper methods
    async updateParentChain(nodeId) {
      try {
        // Get the current node and its parent
        const node = await this.db.get(
          'SELECT id, parent_node_id FROM project_nodes WHERE id = ?',
          [nodeId]
        );
        
        if (!node) return;
        
        // Get all direct children of this node
        const children = await this.db.all(
          'SELECT id, completion FROM project_nodes WHERE parent_node_id = ?',
          [nodeId]
        );
        
        if (children.length === 0) return;
        
        // Check if all children are complete (100% completion)
        const allChildrenComplete = children.every(child => 
          Number(child.completion) === 100
        );
        
        let newCompletion;
        
        if (allChildrenComplete) {
          // If all children are complete, parent is 100% complete
          newCompletion = 100;
        } else {
          // Calculate simple average (no weights)
          let totalCompletion = 0;
          
          for (const child of children) {
            totalCompletion += (Number(child.completion) || 0);
          }
          
          // Calculate average, rounded to nearest integer
          newCompletion = children.length > 0 ? Math.round(totalCompletion / children.length) : 0;
        }
        
        // Update this node's completion directly
        await this.db.run(
          'UPDATE project_nodes SET completion = ? WHERE id = ?',
          [newCompletion, nodeId]
        );
        
        // Continue up the chain if there's a parent
        if (node.parent_node_id) {
          await this.updateParentChain(node.parent_node_id);
        }
      } catch (error) {
        console.error(`Error updating parent chain from node ${nodeId}:`, error);
        throw error;
      }
    }
  
    async updateAllChildren(nodeId, completionValue) {
      try {
        // First, directly update all immediate children in one query
        await this.db.run(
          `UPDATE project_nodes SET completion = ? 
           WHERE parent_node_id = ?`,
          [completionValue, nodeId]
        );
        
        // Then get the children to recursively update their children
        const children = await this.db.all(
          'SELECT id FROM project_nodes WHERE parent_node_id = ?',
          [nodeId]
        );
        
        // Recursively update grandchildren and deeper
        for (const child of children) {
          await this.updateAllChildren(child.id, completionValue);
        }
      } catch (error) {
        console.error(`Error updating children of node ${nodeId}:`, error);
        throw error;
      }
    }
  
    // Function to process project data for frontend (like calculating time progress)
    calculateProjectProgress(nodes, project) {
      // Build node hierarchy
      const nodeMap = {};
      const rootNodes = [];
      
      // Initialize nodeMap with all nodes
      nodes.forEach(node => {
        nodeMap[node.id] = {
          ...node,
          children: [],
          isLeaf: true
        };
      });
      
      // Establish parent-child relationships
      nodes.forEach(node => {
        if (node.parent_node_id && nodeMap[node.parent_node_id]) {
          nodeMap[node.parent_node_id].children.push(nodeMap[node.id]);
          nodeMap[node.parent_node_id].isLeaf = false;
        } else {
          // This is a root node
          rootNodes.push(nodeMap[node.id]);
        }
      });
      
      // Calculate completion recursively
      const calculateNodeCompletion = (node) => {
        // If the node has no children, return its own completion
        if (node.children.length === 0) {
          return Number(node.completion) || 0;
        }
        
        // If all children are 100% complete, this node is 100% complete
        const allChildrenComplete = node.children.length > 0 && 
                                 node.children.every(child => 
                                   Number(child.completion) === 100);
        
        if (allChildrenComplete) {
          return 100;
        }
        
        // Calculate simple average from children
        let totalCompletion = 0;
        
        node.children.forEach(child => {
          totalCompletion += calculateNodeCompletion(child);
        });
        
        // Calculate this node's completion based on children
        return node.children.length > 0 ? 
          totalCompletion / node.children.length : 
          Number(node.completion) || 0;
      };
      
      // Calculate project completion from root nodes
      let totalCompletion = 0;
      
      rootNodes.forEach(node => {
        totalCompletion += calculateNodeCompletion(node);
      });
      
      const completion = rootNodes.length > 0 ? (totalCompletion / rootNodes.length) : 0;
      
      // Calculate time progress
      let timeProgress = 0;
      let daysElapsed = 0;
      let daysRemaining = 0;
      
      if (project.start_date && project.end_date) {
        const startDate = new Date(project.start_date);
        const endDate = new Date(project.end_date);
        const now = new Date();
        
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsedDuration = now.getTime() - startDate.getTime();
        
        timeProgress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
        daysElapsed = Math.floor(elapsedDuration / (1000 * 60 * 60 * 24));
        daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      return {
        completion,
        timeProgress,
        daysElapsed,
        daysRemaining
      };
    }
  
    processProjectsWithProgress(projects) {
      return projects.map(project => {
          const startDate = project.start_date ? new Date(project.start_date) : null;
          const endDate = project.end_date ? new Date(project.end_date) : null;
          const now = new Date();
          
          let timeProgress = 0;
          let daysElapsed = 0;
          let daysRemaining = 0;
          
          if (startDate && endDate) {
              const totalDuration = endDate.getTime() - startDate.getTime();
              const elapsedDuration = now.getTime() - startDate.getTime();
              timeProgress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
              daysElapsed = Math.floor(elapsedDuration / (1000 * 60 * 60 * 24));
              daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          }
          
          return {
              ...project,
              completion: parseFloat(project.avg_completion || 0).toFixed(1),
              timeProgress: parseFloat(timeProgress).toFixed(1),
              daysElapsed,
              daysRemaining,
              isOverdue: daysRemaining < 0
          };
      });
    }

    // Task and Reminder linking methods (add these if they're missing)
    async linkTaskToNode(nodeId, taskId) {
      try {
        // Implementation depends on your database schema
        console.log(`Linking task ${taskId} to node ${nodeId}`);
        return { nodeId, taskId };
      } catch (error) {
        console.error('Error linking task to node:', error);
        throw new Error('Failed to link task to node');
      }
    }

    async linkTaskToNodeAsSubnode(projectId, nodeId, taskId) {
      try {
        // Implementation depends on your database schema
        console.log(`Linking task ${taskId} as subnode to node ${nodeId} in project ${projectId}`);
        return { projectId, nodeId, taskId };
      } catch (error) {
        console.error('Error linking task as subnode:', error);
        throw new Error('Failed to link task as subnode');
      }
    }

    async linkReminderToNode(nodeId, reminderId) {
      try {
        // Implementation depends on your database schema
        console.log(`Linking reminder ${reminderId} to node ${nodeId}`);
        return { nodeId, reminderId };
      } catch (error) {
        console.error('Error linking reminder to node:', error);
        throw new Error('Failed to link reminder to node');
      }
    }
}
  
module.exports = ProjectService;