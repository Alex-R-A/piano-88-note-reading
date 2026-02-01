// components/AnalyticsScreen/StatsTable.tsx

import type { NoteId, NoteStats } from '@/types';
import { MiniStaffNote } from './MiniStaffNote';

interface NoteStatEntry {
  noteId: NoteId;
  stats: NoteStats;
}

interface StatsTableProps {
  perNote: NoteStatEntry[];
}

/**
 * Get accuracy percentage for a note.
 */
function getAccuracy(stats: NoteStats): number {
  if (stats.shown === 0) return 0;
  return (stats.correct / stats.shown) * 100;
}

/**
 * Get row background color based on accuracy range.
 * Per spec lines 356-359:
 * - 0-40%: red #fee2e2
 * - 41-70%: yellow #fef9c3
 * - 71-100%: green #dcfce7
 */
function getRowColor(accuracy: number): string {
  if (accuracy <= 40) return '#fee2e2';
  if (accuracy <= 70) return '#fef9c3';
  return '#dcfce7';
}

/**
 * Displays per-note statistics table.
 * Per spec lines 344-361: sorted by accuracy ascending (worst first),
 * with visual accuracy bar and row coloring based on performance.
 */
export function StatsTable({ perNote }: StatsTableProps) {
  // Filter out notes with zero appearances and sort by accuracy ascending
  const sortedStats = [...perNote]
    .filter((entry) => entry.stats.shown > 0)
    .sort((a, b) => getAccuracy(a.stats) - getAccuracy(b.stats));

  if (sortedStats.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">No notes were practiced in this session.</div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full" data-testid="stats-table">
        <thead>
          <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
            <th className="px-4 py-3">Note</th>
            <th className="px-4 py-3 text-center">Times Shown</th>
            <th className="px-4 py-3 text-center">Correct</th>
            <th className="px-4 py-3">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {sortedStats.map(({ noteId, stats }) => {
            const accuracy = getAccuracy(stats);
            const roundedAccuracy = Math.round(accuracy);
            const bgColor = getRowColor(accuracy);

            return (
              <tr
                key={noteId}
                style={{ backgroundColor: bgColor }}
                className="border-t border-gray-200"
                data-testid={`stats-row-${noteId}`}
              >
                <td className="px-4 py-2">
                  <MiniStaffNote noteId={noteId} />
                </td>
                <td className="px-4 py-3 text-center text-gray-700">{stats.shown}</td>
                <td className="px-4 py-3 text-center text-gray-700">{stats.correct}</td>
                <td className="px-4 py-3 text-center text-gray-700">{roundedAccuracy}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { getAccuracy, getRowColor };
