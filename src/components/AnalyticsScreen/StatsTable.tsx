// components/AnalyticsScreen/StatsTable.tsx

import type { NoteId, NoteStats } from '@/types';
import { parseNote, extractPitchClass } from '@/utils/noteUtils';

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
 * - 0-40%: red
 * - 41-70%: yellow
 * - 71-100%: green
 */
function getRowColor(accuracy: number): string {
  if (accuracy <= 40) return 'bg-red-50';
  if (accuracy <= 70) return 'bg-amber-50';
  return 'bg-emerald-50';
}

/**
 * Displays per-note statistics table.
 * Per spec lines 344-361: sorted by accuracy ascending (worst first),
 * with row coloring based on performance.
 */
export function StatsTable({ perNote }: StatsTableProps) {
  // Filter out notes with zero appearances and sort by accuracy ascending
  const sortedStats = [...perNote]
    .filter((entry) => entry.stats.shown > 0)
    .sort((a, b) => getAccuracy(a.stats) - getAccuracy(b.stats));

  if (sortedStats.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">No notes were practiced in this session.</div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      <table className="w-full" data-testid="stats-table">
        <thead>
          <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <th className="px-4 py-4 text-center">Octave</th>
            <th className="px-4 py-4">Note</th>
            <th className="px-4 py-4 text-center">Shown</th>
            <th className="px-4 py-4 text-center">Correct</th>
            <th className="px-4 py-4 text-center">Wrong</th>
            <th className="px-4 py-4 text-center">Accuracy</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedStats.map(({ noteId, stats }) => {
            const accuracy = getAccuracy(stats);
            const roundedAccuracy = Math.round(accuracy);
            const bgColor = getRowColor(accuracy);
            const octave = parseNote(noteId).octave;
            const pitchClass = extractPitchClass(noteId);

            return (
              <tr
                key={noteId}
                className={bgColor}
                data-testid={`stats-row-${noteId}`}
              >
                <td className="px-4 py-3 text-center text-slate-600 font-medium">{octave}</td>
                <td className="px-4 py-3 text-slate-800 font-medium">{pitchClass}</td>
                <td className="px-4 py-3 text-center text-slate-600 font-medium">{stats.shown}</td>
                <td className="px-4 py-3 text-center text-emerald-600 font-medium">{stats.correct}</td>
                <td className="px-4 py-3 text-center text-red-500 font-medium">{stats.shown - stats.correct}</td>
                <td className="px-4 py-3 text-center text-slate-700 font-semibold">{roundedAccuracy}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { getAccuracy, getRowColor };
