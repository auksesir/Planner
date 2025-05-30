import { fireEvent, render, screen } from '@testing-library/react';
import { NewNodeDialog, NewProjectDialog } from '../../../components/mind_mapping_utilities/ProjectDialogs';

describe('Project Dialogs', () => {
  const mockAlertFn = jest.fn();
  
  // Mock window.alert before tests
  beforeAll(() => {
    window.alert = mockAlertFn;
  });

  // Clear mocks after each test
  afterEach(() => {
    mockAlertFn.mockClear();
  });

  describe('NewProjectDialog', () => {
    test('renders dialog with input fields', () => {
      const mockOnCreate = jest.fn();
      render(<NewProjectDialog open={true} onClose={jest.fn()} onCreate={mockOnCreate} />);
      
      // Use data-testid as a more reliable selector
      const nameInput = screen.getByTestId('project-name-input');
      const startDateInput = screen.getByTestId('start-date-input');
      const endDateInput = screen.getByTestId('end-date-input');
      
      expect(nameInput).toBeInTheDocument();
      expect(startDateInput).toBeInTheDocument();
      expect(endDateInput).toBeInTheDocument();
    });

    test('validates and creates project', () => {
      const mockOnCreate = jest.fn();
      const mockOnClose = jest.fn();
      
      render(
        <NewProjectDialog 
          open={true} 
          onClose={mockOnClose} 
          onCreate={mockOnCreate} 
        />
      );
      
      // Fill out form using data-testid
      const nameInput = screen.getByTestId('project-name-input');
      const startDateInput = screen.getByTestId('start-date-input');
      const endDateInput = screen.getByTestId('end-date-input');
      
      fireEvent.change(nameInput, { 
        target: { value: 'Test Project' } 
      });
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      fireEvent.change(startDateInput, { 
        target: { value: today.toISOString().split('T')[0] } 
      });
      
      fireEvent.change(endDateInput, { 
        target: { value: tomorrow.toISOString().split('T')[0] } 
      });
      
      // Submit form
      fireEvent.click(screen.getByText('Create'));
      
      expect(mockOnCreate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Project'
      }));
    });

    test('prevents submission with invalid dates', () => {
      const mockOnCreate = jest.fn();
      const mockOnClose = jest.fn();
      
      render(
        <NewProjectDialog 
          open={true} 
          onClose={mockOnClose} 
          onCreate={mockOnCreate} 
        />
      );
      
      const nameInput = screen.getByTestId('project-name-input');
      const startDateInput = screen.getByTestId('start-date-input');
      const endDateInput = screen.getByTestId('end-date-input');
      
      fireEvent.change(nameInput, { 
        target: { value: 'Test Project' } 
      });
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      fireEvent.change(startDateInput, { 
        target: { value: today.toISOString().split('T')[0] } 
      });
      
      fireEvent.change(endDateInput, { 
        target: { value: yesterday.toISOString().split('T')[0] } 
      });
      
      // Submit form
      fireEvent.click(screen.getByText('Create'));
      
      expect(mockAlertFn).toHaveBeenCalledWith('End date must be after start date');
      expect(mockOnCreate).not.toHaveBeenCalled();
    });
  });

  describe('NewNodeDialog', () => {
    test('renders dialog with input fields', () => {
      const mockOnCreate = jest.fn();
      render(<NewNodeDialog open={true} onClose={jest.fn()} onCreate={mockOnCreate} />);
      
      // Use data-testid as a more reliable selector
      const nameInput = screen.getByTestId('node-name-input');
      const deadlineInput = screen.getByTestId('node-deadline-input');
      
      expect(nameInput).toBeInTheDocument();
      expect(deadlineInput).toBeInTheDocument();
    });

    test('creates node with minimal required data', () => {
      const mockOnCreate = jest.fn();
      const mockOnClose = jest.fn();
      
      render(
        <NewNodeDialog 
          open={true} 
          onClose={mockOnClose} 
          onCreate={mockOnCreate} 
        />
      );
      
      // Fill out form using data-testid
      const nameInput = screen.getByTestId('node-name-input');
      
      fireEvent.change(nameInput, { 
        target: { value: 'Test Node' } 
      });
      
      // Submit form
      fireEvent.click(screen.getByText('Add Node'));
      
      expect(mockOnCreate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test Node',
        deadline: null,
        weight: 1
      }));
    });
  });
});