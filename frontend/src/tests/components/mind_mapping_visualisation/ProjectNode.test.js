import { fireEvent, render, screen } from '@testing-library/react';
import ProjectNode from '../../../components/mind_mapping_visualisation/ProjectNode';

describe('ProjectNode Component', () => {
  const mockNode = {
    id: 1,
    name: 'Test Node',
    completion: 50,
    position_x: 100,
    position_y: 100,
    deadline: new Date('2023-01-01').toISOString() // Set to a past date to trigger 'ago'
  };

  const mockProps = {
    node: mockNode,
    onMouseDown: jest.fn(),
    onClick: jest.fn(),
    onAddSubnode: jest.fn(),
    onDeleteNode: jest.fn(),
    onUpdateCompletion: jest.fn(),
    childrenComplete: true
  };

  test('renders node with correct information', () => {
    render(<ProjectNode {...mockProps} />);
    
    expect(screen.getByText('Test Node')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('shows days remaining', () => {
    render(<ProjectNode {...mockProps} />);
    
    // Try to find the deadline text more flexibly
    const daysRemainingText = screen.getByText((content, element) => {
      // Check if the text is within a deadline-related element
      return (
        element.closest('.node-deadline') &&
        /\d+d\s*(left|ago)/.test(content)
      );
    });
    
    expect(daysRemainingText).toBeInTheDocument();
  });

  test('handles completion toggle', () => {
    render(<ProjectNode {...mockProps} />);
    
    // Hover to show complete button
    const node = screen.getByText('Test Node');
    fireEvent.mouseEnter(node);
    
    const completeButton = screen.getByTitle('Mark as complete');
    fireEvent.click(completeButton);

    expect(mockProps.onUpdateCompletion).toHaveBeenCalledWith(1, 100);
  });

  test('handles node deletion', () => {
    render(<ProjectNode {...mockProps} />);
    
    // Hover to show delete button
    const node = screen.getByText('Test Node');
    fireEvent.mouseEnter(node);
    
    const deleteButton = screen.getByTitle('Delete node');
    fireEvent.click(deleteButton);

    expect(mockProps.onDeleteNode).toHaveBeenCalledWith(1);
  });

  test('handles overdue deadline', () => {
    const overdueNode = {
      ...mockNode,
      deadline: new Date('2022-01-01').toISOString() // Set to a past date
    };

    render(<ProjectNode {...mockProps} node={overdueNode} />);
    
    // Find overdue deadline text
    const overdueText = screen.getByText((content, element) => {
      return (
        element.closest('.node-deadline.overdue') &&
        content.includes('⚠️') &&
        content.includes('d ago')
      );
    });

    expect(overdueText).toBeInTheDocument();
  });

  test('handles node without deadline', () => {
    const nodeWithoutDeadline = {
      ...mockNode,
      deadline: null
    };

    const { container } = render(<ProjectNode {...mockProps} node={nodeWithoutDeadline} />);
    
    // Ensure no deadline is rendered
    const deadlineElement = container.querySelector('.node-deadline');
    expect(deadlineElement).toBeNull();
  });
});