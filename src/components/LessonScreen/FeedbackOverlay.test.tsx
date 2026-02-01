// components/LessonScreen/FeedbackOverlay.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackOverlay } from './FeedbackOverlay';

describe('FeedbackOverlay', () => {
  it('renders with transparent background when state is "none"', () => {
    render(<FeedbackOverlay feedbackState="none" />);
    const overlay = screen.getByTestId('feedback-overlay');

    expect(overlay).toBeInTheDocument();
    // Check that opacity is 0 (invisible), meaning no visible color
    expect(overlay).toHaveStyle({ opacity: '0' });
    // Verify the computed backgroundColor is either transparent or rgba(0,0,0,0)
    const bgColor = overlay.style.backgroundColor;
    expect(bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === '').toBe(true);
  });

  it('renders with green background when state is "correct"', () => {
    render(<FeedbackOverlay feedbackState="correct" />);
    const overlay = screen.getByTestId('feedback-overlay');

    expect(overlay).toHaveStyle({ backgroundColor: 'rgba(34, 197, 94, 0.3)' });
    expect(overlay).toHaveStyle({ opacity: '1' });
  });

  it('renders with red background when state is "incorrect"', () => {
    render(<FeedbackOverlay feedbackState="incorrect" />);
    const overlay = screen.getByTestId('feedback-overlay');

    expect(overlay).toHaveStyle({ backgroundColor: 'rgba(239, 68, 68, 0.3)' });
    expect(overlay).toHaveStyle({ opacity: '1' });
  });

  it('renders with transparent background when state is "showAnswer"', () => {
    render(<FeedbackOverlay feedbackState="showAnswer" />);
    const overlay = screen.getByTestId('feedback-overlay');

    // showAnswer state should be transparent (key highlighting handled by PianoKeyboard3D)
    expect(overlay).toHaveStyle({ opacity: '0' });
    // Verify the computed backgroundColor is either transparent or rgba(0,0,0,0)
    const bgColor = overlay.style.backgroundColor;
    expect(bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === '').toBe(true);
  });

  it('has pointer-events: none to allow clicks to pass through', () => {
    render(<FeedbackOverlay feedbackState="correct" />);
    const overlay = screen.getByTestId('feedback-overlay');

    expect(overlay).toHaveClass('pointer-events-none');
  });

  it('has fixed positioning to cover the full screen', () => {
    render(<FeedbackOverlay feedbackState="none" />);
    const overlay = screen.getByTestId('feedback-overlay');

    expect(overlay).toHaveClass('fixed', 'inset-0');
  });

  it('has proper CSS transitions for fade effect', () => {
    render(<FeedbackOverlay feedbackState="correct" />);
    const overlay = screen.getByTestId('feedback-overlay');

    // Check that transition includes both background-color and opacity with 200ms duration
    expect(overlay).toHaveStyle({
      transition: 'background-color 200ms ease-out, opacity 200ms ease-out',
    });
  });

  it('has z-index of 0 to render behind content', () => {
    render(<FeedbackOverlay feedbackState="correct" />);
    const overlay = screen.getByTestId('feedback-overlay');

    expect(overlay).toHaveStyle({ zIndex: '0' });
  });

  it('has aria-hidden="true" for accessibility', () => {
    render(<FeedbackOverlay feedbackState="none" />);
    const overlay = screen.getByTestId('feedback-overlay');

    expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });
});
