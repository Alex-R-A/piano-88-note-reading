// components/MainScreen/SettingsPanel.tsx

import { Toggle } from '../ui/Toggle';

interface SettingsPanelProps {
  includeSharpsFlats: boolean;
  audioEnabled: boolean;
  showCorrectAnswer: boolean;
  showStaffDisplay: boolean;
  onIncludeSharpsFlatsChange: (value: boolean) => void;
  onAudioEnabledChange: (value: boolean) => void;
  onShowCorrectAnswerChange: (value: boolean) => void;
  onShowStaffDisplayChange: (value: boolean) => void;
}

export function SettingsPanel({
  includeSharpsFlats,
  audioEnabled,
  showCorrectAnswer,
  showStaffDisplay,
  onIncludeSharpsFlatsChange,
  onAudioEnabledChange,
  onShowCorrectAnswerChange,
  onShowStaffDisplayChange,
}: SettingsPanelProps) {
  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md border border-slate-200">
      <h2 className="text-base font-medium text-slate-600 mb-5 text-center uppercase tracking-wide">Settings</h2>

      <div className="space-y-4">
        {/* Include Sharps & Flats */}
        <div className="flex items-center justify-between gap-6">
          <label htmlFor="sharpsFlats" className="text-slate-700">
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
        <div className="flex items-center justify-between gap-6">
          <label htmlFor="audio" className="text-slate-700">
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
        <div className="flex items-center justify-between gap-6">
          <label htmlFor="showAnswer" className="text-slate-700">
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
        <div className="flex items-center justify-between gap-6">
          <label htmlFor="showStaff" className="text-slate-700">
            Show Staff Display
          </label>
          <Toggle
            id="showStaff"
            checked={showStaffDisplay}
            onCheckedChange={onShowStaffDisplayChange}
            aria-label="Show visual staff with note"
          />
        </div>
      </div>
    </div>
  );
}
