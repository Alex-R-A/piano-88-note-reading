// components/MainScreen/MainScreen.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainScreen } from './MainScreen';
import { useSettingsStore } from '@/stores/settingsStore';

describe('MainScreen', () => {
  beforeEach(() => {
    // Reset store to default state before each test
    useSettingsStore.setState({
      selectedOctaves: new Set([4]),
      includeSharpsFlats: false,
      audioEnabled: true,
      showCorrectAnswer: false,
    });
  });

  describe('Octave checkboxes', () => {
    it('should render 9 octave checkboxes (0-8)', () => {
      render(<MainScreen onStartLesson={() => {}} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(9);
    });

    it('should have octave 4 checked by default', () => {
      render(<MainScreen onStartLesson={() => {}} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // Octave 4 is at index 4 (0-indexed)
      expect(checkboxes[4]).toBeChecked();

      // Others should not be checked
      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).not.toBeChecked();
      expect(checkboxes[3]).not.toBeChecked();
      expect(checkboxes[5]).not.toBeChecked();
      expect(checkboxes[6]).not.toBeChecked();
      expect(checkboxes[7]).not.toBeChecked();
      expect(checkboxes[8]).not.toBeChecked();
    });

    it('should toggle octave selection when checkbox is clicked', () => {
      render(<MainScreen onStartLesson={() => {}} />);

      const checkboxes = screen.getAllByRole('checkbox');

      // Click octave 3 (index 3) to select it
      fireEvent.click(checkboxes[3]);
      expect(checkboxes[3]).toBeChecked();

      // Click octave 4 (index 4) to deselect it
      fireEvent.click(checkboxes[4]);
      expect(checkboxes[4]).not.toBeChecked();
    });

    it('should allow multiple octaves to be selected', () => {
      render(<MainScreen onStartLesson={() => {}} />);

      const checkboxes = screen.getAllByRole('checkbox');

      // Select octaves 3 and 5 in addition to default octave 4
      fireEvent.click(checkboxes[3]);
      fireEvent.click(checkboxes[5]);

      expect(checkboxes[3]).toBeChecked();
      expect(checkboxes[4]).toBeChecked();
      expect(checkboxes[5]).toBeChecked();
    });
  });

  describe('Settings toggles', () => {
    it('should render three toggle switches', () => {
      render(<MainScreen onStartLesson={() => {}} />);

      expect(screen.getByLabelText('Include sharps and flats')).toBeInTheDocument();
      expect(screen.getByLabelText('Enable audio')).toBeInTheDocument();
      expect(screen.getByLabelText('Show correct answer after wrong answer')).toBeInTheDocument();
    });

    it('should have correct default toggle states', () => {
      render(<MainScreen onStartLesson={() => {}} />);

      // Sharps/flats: OFF by default
      const sharpsFlatsToggle = screen.getByLabelText('Include sharps and flats');
      expect(sharpsFlatsToggle).toHaveAttribute('data-state', 'unchecked');

      // Audio: ON by default
      const audioToggle = screen.getByLabelText('Enable audio');
      expect(audioToggle).toHaveAttribute('data-state', 'checked');

      // Show correct answer: OFF by default
      const showAnswerToggle = screen.getByLabelText('Show correct answer after wrong answer');
      expect(showAnswerToggle).toHaveAttribute('data-state', 'unchecked');
    });

    it('should toggle settings when clicked', () => {
      render(<MainScreen onStartLesson={() => {}} />);

      const sharpsFlatsToggle = screen.getByLabelText('Include sharps and flats');
      const audioToggle = screen.getByLabelText('Enable audio');
      const showAnswerToggle = screen.getByLabelText('Show correct answer after wrong answer');

      // Toggle sharps/flats ON
      fireEvent.click(sharpsFlatsToggle);
      expect(sharpsFlatsToggle).toHaveAttribute('data-state', 'checked');

      // Toggle audio OFF
      fireEvent.click(audioToggle);
      expect(audioToggle).toHaveAttribute('data-state', 'unchecked');

      // Toggle show answer ON
      fireEvent.click(showAnswerToggle);
      expect(showAnswerToggle).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('Start button', () => {
    it('should be enabled when at least one octave is selected', () => {
      render(<MainScreen onStartLesson={() => {}} />);

      const startButton = screen.getByRole('button', { name: /start lesson/i });
      expect(startButton).not.toBeDisabled();
    });

    it('should be disabled when no octaves are selected', () => {
      // Reset to no octaves selected
      useSettingsStore.setState({
        selectedOctaves: new Set(),
        includeSharpsFlats: false,
        audioEnabled: true,
        showCorrectAnswer: false,
      });

      render(<MainScreen onStartLesson={() => {}} />);

      const startButton = screen.getByRole('button', { name: /start lesson/i });
      expect(startButton).toBeDisabled();
    });

    it('should show helper text when disabled', () => {
      useSettingsStore.setState({
        selectedOctaves: new Set(),
        includeSharpsFlats: false,
        audioEnabled: true,
        showCorrectAnswer: false,
      });

      render(<MainScreen onStartLesson={() => {}} />);

      expect(screen.getByText(/select at least one octave to start/i)).toBeInTheDocument();
    });

    it('should call onStartLesson when clicked', () => {
      const onStartLesson = vi.fn();
      render(<MainScreen onStartLesson={onStartLesson} />);

      const startButton = screen.getByRole('button', { name: /start lesson/i });
      fireEvent.click(startButton);

      expect(onStartLesson).toHaveBeenCalledTimes(1);
    });

    it('should become disabled after deselecting all octaves', () => {
      render(<MainScreen onStartLesson={() => {}} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const startButton = screen.getByRole('button', { name: /start lesson/i });

      // Initially enabled (octave 4 selected)
      expect(startButton).not.toBeDisabled();

      // Deselect octave 4
      fireEvent.click(checkboxes[4]);

      // Now should be disabled
      expect(startButton).toBeDisabled();
    });

    it('should become enabled after selecting an octave', () => {
      useSettingsStore.setState({
        selectedOctaves: new Set(),
        includeSharpsFlats: false,
        audioEnabled: true,
        showCorrectAnswer: false,
      });

      render(<MainScreen onStartLesson={() => {}} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const startButton = screen.getByRole('button', { name: /start lesson/i });

      // Initially disabled
      expect(startButton).toBeDisabled();

      // Select octave 2
      fireEvent.click(checkboxes[2]);

      // Now should be enabled
      expect(startButton).not.toBeDisabled();
    });
  });

  describe('WebGL disabled', () => {
    it('should disable start button when webGLDisabled is true', () => {
      render(<MainScreen onStartLesson={() => {}} webGLDisabled={true} />);

      const startButton = screen.getByRole('button', { name: /start lesson/i });
      expect(startButton).toBeDisabled();
    });

    it('should show WebGL error message when webGLDisabled is true', () => {
      render(<MainScreen onStartLesson={() => {}} webGLDisabled={true} />);

      expect(screen.getByText(/3D graphics not supported/i)).toBeInTheDocument();
    });

    it('should not show octave selection message when webGLDisabled is true', () => {
      useSettingsStore.setState({
        selectedOctaves: new Set(),
        includeSharpsFlats: false,
        audioEnabled: true,
        showCorrectAnswer: false,
      });

      render(<MainScreen onStartLesson={() => {}} webGLDisabled={true} />);

      // Should show WebGL error, not octave selection error
      expect(screen.getByText(/3D graphics not supported/i)).toBeInTheDocument();
      expect(screen.queryByText(/select at least one octave to start/i)).not.toBeInTheDocument();
    });
  });

  describe('Store integration', () => {
    it('should persist octave selection in store', () => {
      render(<MainScreen onStartLesson={() => {}} />);

      const checkboxes = screen.getAllByRole('checkbox');

      // Select octaves 0, 1, 2
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);

      const state = useSettingsStore.getState();
      expect(state.selectedOctaves.has(0)).toBe(true);
      expect(state.selectedOctaves.has(1)).toBe(true);
      expect(state.selectedOctaves.has(2)).toBe(true);
      expect(state.selectedOctaves.has(4)).toBe(true); // Still selected from default
    });

    it('should persist toggle settings in store', () => {
      render(<MainScreen onStartLesson={() => {}} />);

      const sharpsFlatsToggle = screen.getByLabelText('Include sharps and flats');
      const audioToggle = screen.getByLabelText('Enable audio');
      const showAnswerToggle = screen.getByLabelText('Show correct answer after wrong answer');

      fireEvent.click(sharpsFlatsToggle);
      fireEvent.click(audioToggle);
      fireEvent.click(showAnswerToggle);

      const state = useSettingsStore.getState();
      expect(state.includeSharpsFlats).toBe(true);
      expect(state.audioEnabled).toBe(false);
      expect(state.showCorrectAnswer).toBe(true);
    });
  });
});
