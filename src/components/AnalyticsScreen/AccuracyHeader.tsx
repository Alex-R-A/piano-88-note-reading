// components/AnalyticsScreen/AccuracyHeader.tsx

interface AccuracyHeaderProps {
  overallAccuracy: number;
}

/**
 * Displays "Session Complete!" title and overall accuracy percentage.
 * Per spec lines 339-342: accuracy in large font (48px+), rounded to nearest integer.
 */
export function AccuracyHeader({ overallAccuracy }: AccuracyHeaderProps) {
  const roundedAccuracy = Math.round(overallAccuracy);

  // Color based on performance
  const getAccuracyColor = () => {
    if (roundedAccuracy >= 80) return 'text-emerald-700';
    if (roundedAccuracy >= 50) return 'text-brass-700';
    return 'text-felt-600';
  };

  return (
    <div className="text-center mb-10">
      <h1 className="font-display text-6xl font-semibold text-ink-900 leading-none">Session Complete</h1>
      <div className="rule-brass mx-auto mt-4 w-56" />
      <p className="mt-4 mb-8 text-sm uppercase tracking-[0.25em] text-ink-500">Here's how you did</p>
      <div className="bg-ivory-50 rounded-2xl shadow-lift ring-1 ring-ink-200 px-14 py-8 inline-block">
        <div className="text-[11px] font-medium text-ink-400 uppercase tracking-[0.25em] mb-3">Overall Accuracy</div>
        <div
          className={`font-display font-semibold tabular lining-nums ${getAccuracyColor()}`}
          style={{ fontSize: '80px', lineHeight: 1 }}
          data-testid="overall-accuracy"
        >
          {roundedAccuracy}%
        </div>
      </div>
    </div>
  );
}
