// components/AnalyticsScreen/AnalyticsScreen.tsx

import { useLessonStore } from '@/stores/lessonStore';
import { AccuracyHeader } from './AccuracyHeader';
import { StatsTable } from './StatsTable';
import { Button } from '../ui/Button';

interface AnalyticsScreenProps {
  onBackToMain: () => void;
}

/**
 * Analytics Screen - shows session performance summary.
 * Per spec lines 309-367: displays overall accuracy, per-note statistics table,
 * and a "Back to Main Menu" button.
 */
export function AnalyticsScreen({ onBackToMain }: AnalyticsScreenProps) {
  const getSessionStats = useLessonStore((state) => state.getSessionStats);
  const { overall, perNote } = getSessionStats();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      <AccuracyHeader overallAccuracy={overall} />

      <StatsTable perNote={perNote} />

      <div className="mt-8">
        <Button onClick={onBackToMain} variant="secondary">
          Back to Main Menu
        </Button>
      </div>
    </div>
  );
}
