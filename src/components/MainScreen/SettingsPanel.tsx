// components/MainScreen/SettingsPanel.tsx

import { Toggle } from '../ui/Toggle';

interface SettingsPanelProps {
  includeSharpsFlats: boolean;
  audioEnabled: boolean;
  showCorrectAnswer: boolean;
  showStaffDisplay: boolean;
  micEnabled: boolean;
  micError?: string | null;
  onIncludeSharpsFlatsChange: (value: boolean) => void;
  onAudioEnabledChange: (value: boolean) => void;
  onShowCorrectAnswerChange: (value: boolean) => void;
  onShowStaffDisplayChange: (value: boolean) => void;
  onMicEnabledChange: (value: boolean) => void;
}

export function SettingsPanel({
  includeSharpsFlats,
  audioEnabled,
  showCorrectAnswer,
  showStaffDisplay,
  micEnabled,
  micError,
  onIncludeSharpsFlatsChange,
  onAudioEnabledChange,
  onShowCorrectAnswerChange,
  onShowStaffDisplayChange,
  onMicEnabledChange,
}: SettingsPanelProps) {
  return (
    <div className="w-full max-w-md p-6 bg-ivory-50 rounded-xl shadow-card ring-1 ring-ink-200">
      <h2 className="text-xs font-medium text-ink-500 mb-5 text-center uppercase tracking-[0.25em]">
        Settings
      </h2>
      <div className="rule-brass mb-5 opacity-60" />

      {/* Hairlines between rows, the way a printed table of contents reads. */}
      <div className="divide-y divide-ink-100 -my-2.5">
        {/* Include Sharps & Flats */}
        <div className="flex items-center justify-between gap-6 py-2.5">
          <label htmlFor="sharpsFlats" className="text-ink-700 text-[0.95rem]">
            Include Sharps & Flats
          </label>
          <Toggle
            id="sharpsFlats"
            checked={includeSharpsFlats}
            onCheckedChange={onIncludeSharpsFlatsChange}
            aria-label="Include sharps and flats"
          />
        </div>

        {/* Enable Audio */}
        <div className="flex items-center justify-between gap-6 py-2.5">
          <label htmlFor="audio" className="text-ink-700 text-[0.95rem]">
            Enable Audio
          </label>
          <Toggle
            id="audio"
            checked={audioEnabled}
            onCheckedChange={onAudioEnabledChange}
            aria-label="Enable audio"
          />
        </div>

        {/* Show Correct Answer */}
        <div className="flex items-center justify-between gap-6 py-2.5">
          <label htmlFor="showAnswer" className="text-ink-700 text-[0.95rem]">
            Show Correct Answer
          </label>
          <Toggle
            id="showAnswer"
            checked={showCorrectAnswer}
            onCheckedChange={onShowCorrectAnswerChange}
            aria-label="Show correct answer after wrong answer"
          />
        </div>

        {/* Show Staff Display */}
        <div className="flex items-center justify-between gap-6 py-2.5">
          <label htmlFor="showStaff" className="text-ink-700 text-[0.95rem]">
            Show Staff Display
          </label>
          <Toggle
            id="showStaff"
            checked={showStaffDisplay}
            onCheckedChange={onShowStaffDisplayChange}
            aria-label="Show visual staff with note"
          />
        </div>

        {/* Use Microphone */}
        <div className="flex items-center justify-between gap-6 py-2.5">
          <label htmlFor="mic" className="text-ink-700 text-[0.95rem]">
            Use Microphone
          </label>
          <Toggle
            id="mic"
            checked={micEnabled}
            onCheckedChange={onMicEnabledChange}
            aria-label="Use microphone for note detection"
          />
        </div>
        {micError && (
          <p className="text-sm text-felt-600 pt-2.5">{micError}</p>
        )}
      </div>
    </div>
  );
}
