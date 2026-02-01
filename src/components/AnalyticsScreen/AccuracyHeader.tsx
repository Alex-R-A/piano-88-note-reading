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
    if (roundedAccuracy >= 80) return 'text-emerald-600';
    if (roundedAccuracy >= 50) return 'text-amber-600';
    return 'text-red-500';
  };

  return (
    <div className="text-center mb-10">
      <h1 className="text-4xl font-bold text-slate-800 mb-2">Session Complete</h1>
      <p className="text-slate-500 text-lg mb-6">Here's how you did</p>
      <div className="bg-white rounded-2xl shadow-lg px-12 py-8 inline-block">
        <div className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">Overall Accuracy</div>
        <div
          className={`font-bold ${getAccuracyColor()}`}
          style={{ fontSize: '64px', lineHeight: 1 }}
          data-testid="overall-accuracy"
        >
          {roundedAccuracy}%
        </div>
      </div>
    </div>
  );
}
