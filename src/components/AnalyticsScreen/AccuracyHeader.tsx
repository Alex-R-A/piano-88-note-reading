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

  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Session Complete!</h1>
      <div className="text-gray-600 text-lg mb-2">Overall Accuracy</div>
      <div
        className="font-bold text-gray-900"
        style={{ fontSize: '48px', lineHeight: 1.2 }}
        data-testid="overall-accuracy"
      >
        {roundedAccuracy}%
      </div>
    </div>
  );
}
