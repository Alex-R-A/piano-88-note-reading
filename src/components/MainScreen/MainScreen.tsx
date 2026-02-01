// components/MainScreen/MainScreen.tsx

import { useSettingsStore } from '@/stores/settingsStore';
import { PianoOverview } from './PianoOverview';
import { SettingsPanel } from './SettingsPanel';
import { Button } from '../ui/Button';

interface MainScreenProps {
  onStartLesson: () => void;
  webGLDisabled?: boolean;
}

export function MainScreen({ onStartLesson, webGLDisabled = false }: MainScreenProps) {
  const {
    selectedOctaves,
    includeSharpsFlats,
    audioEnabled,
    showCorrectAnswer,
    showStaffDisplay,
    toggleOctave,
    setIncludeSharpsFlats,
    setAudioEnabled,
    setShowCorrectAnswer,
    setShowStaffDisplay,
    isStartEnabled,
  } = useSettingsStore();

  // Disable start if no octaves selected OR if WebGL is not supported
  const canStart = isStartEnabled() && !webGLDisabled;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Piano 88</h1>
        <p className="text-lg text-slate-500">Visual and Audio Note Learning</p>
      </div>

      {/* Piano visualization with octave selection */}
      <div className="mb-10">
        <p className="text-sm text-slate-500 text-center mb-3">Select octaves to practice</p>
        <PianoOverview selectedOctaves={selectedOctaves} onToggleOctave={toggleOctave} />
      </div>

      {/* Settings panel */}
      <div className="mb-10">
        <SettingsPanel
          includeSharpsFlats={includeSharpsFlats}
          audioEnabled={audioEnabled}
          showCorrectAnswer={showCorrectAnswer}
          showStaffDisplay={showStaffDisplay}
          onIncludeSharpsFlatsChange={setIncludeSharpsFlats}
          onAudioEnabledChange={setAudioEnabled}
          onShowCorrectAnswerChange={setShowCorrectAnswer}
          onShowStaffDisplayChange={setShowStaffDisplay}
        />
      </div>

      {/* Start button */}
      <Button
        onClick={onStartLesson}
        disabled={!canStart}
        variant="primary"
        className="px-10 py-4 text-lg font-semibold bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500 shadow-lg hover:shadow-xl transition-shadow"
      >
        Start Lesson
      </Button>

      {/* Helper text when start is disabled */}
      {!canStart && !webGLDisabled && (
        <p className="mt-4 text-sm text-slate-400">Select at least one octave to start</p>
      )}
      {webGLDisabled && (
        <p className="mt-4 text-sm text-red-500">
          3D graphics not supported - lessons unavailable
        </p>
      )}
    </div>
  );
}
