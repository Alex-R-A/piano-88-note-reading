// components/LessonScreen/FeedbackOverlay.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackOverlay } from './FeedbackOverlay';

describe('FeedbackOverlay', () => {
  it('exposes the feedback state for observation', () => {
    const { rerender } = render(<FeedbackOverlay feedbackState="none" />);
    expect(screen.getByTestId('feedback-overlay')).toHaveAttribute('data-feedback', 'none');

    rerender(<FeedbackOverlay feedbackState="correct" />);
    expect(screen.getByTestId('feedback-overlay')).toHaveAttribute('data-feedback', 'correct');

    rerender(<FeedbackOverlay feedbackState="incorrect" />);
    expect(screen.getByTestId('feedback-overlay')).toHaveAttribute('data-feedback', 'incorrect');
  });

  it('shows no visual feedback for a correct answer (the advance is the confirmation)', () => {
    render(<FeedbackOverlay feedbackState="correct" />);
    expect(screen.queryAllByText('Boo!')).toHaveLength(0);
  });

  it('shows nothing in the idle and showAnswer states', () => {
    const { rerender } = render(<FeedbackOverlay feedbackState="none" />);
    expect(screen.queryAllByText('Boo!')).toHaveLength(0);

    rerender(<FeedbackOverlay feedbackState="showAnswer" />);
    expect(screen.queryAllByText('Boo!')).toHaveLength(0);
  });

  it('launches a wave of Boo!s on a wrong answer', () => {
    const { rerender } = render(<FeedbackOverlay feedbackState="none" />);
    rerender(<FeedbackOverlay feedbackState="incorrect" />);

    expect(screen.getAllByText('Boo!').length).toBeGreaterThanOrEqual(8);
  });

  it('launches a fresh wave for each consecutive mistake', () => {
    const { rerender } = render(<FeedbackOverlay feedbackState="none" />);
    rerender(<FeedbackOverlay feedbackState="incorrect" />);
    const firstWave = screen.getAllByText('Boo!').length;

    rerender(<FeedbackOverlay feedbackState="none" />);
    rerender(<FeedbackOverlay feedbackState="incorrect" />);
    expect(screen.getAllByText('Boo!').length).toBe(firstWave);
  });

  it('lets clicks pass through and stays behind content', () => {
    render(<FeedbackOverlay feedbackState="incorrect" />);
    const overlay = screen.getByTestId('feedback-overlay');

    expect(overlay).toHaveClass('pointer-events-none', 'fixed', 'inset-0');
    expect(overlay).toHaveStyle({ zIndex: '0' });
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });
});
