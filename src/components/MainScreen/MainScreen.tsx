// components/MainScreen/MainScreen.tsx

import { useSettingsStore } from '@/stores/settingsStore';
import { PianoOverview } from './PianoOverview';
import { SettingsPanel } from './SettingsPanel';
import { Button } from '../ui/Button';

interface MainScreenProps {
  onStartLesson: () => void;
}

export function MainScreen({ onStartLesson }: MainScreenProps) {
  const {
    selectedOctaves,
    includeSharpsFlats,
    audioEnabled,
    showCorrectAnswer,
    toggleOctave,
    setIncludeSharpsFlats,
    setAudioEnabled,
    setShowCorrectAnswer,
    isStartEnabled,
  } = useSettingsStore();

  const canStart = isStartEnabled();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Piano Note Learning</h1>

      {/* Piano visualization with octave selection */}
      <div className="mb-8">
        <PianoOverview selectedOctaves={selectedOctaves} onToggleOctave={toggleOctave} />
      </div>

      {/* Settings panel */}
      <div className="mb-8">
        <SettingsPanel
          includeSharpsFlats={includeSharpsFlats}
          audioEnabled={audioEnabled}
          showCorrectAnswer={showCorrectAnswer}
          onIncludeSharpsFlatsChange={setIncludeSharpsFlats}
          onAudioEnabledChange={setAudioEnabled}
          onShowCorrectAnswerChange={setShowCorrectAnswer}
        />
      </div>

      {/* Start button */}
      <Button onClick={onStartLesson} disabled={!canStart} variant="primary">
        Start Lesson
      </Button>

      {/* Helper text when no octaves selected */}
      {!canStart && (
        <p className="mt-4 text-sm text-gray-500">Select at least one octave to start</p>
      )}
    </div>
  );
}
