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
    toggleOctave,
    setIncludeSharpsFlats,
    setAudioEnabled,
    setShowCorrectAnswer,
    isStartEnabled,
  } = useSettingsStore();

  // Disable start if no octaves selected OR if WebGL is not supported
  const canStart = isStartEnabled() && !webGLDisabled;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-8 px-4">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Piano 88 Note Learning</h1>

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
      <Button onClick={onStartLesson} disabled={!canStart} variant="primary" className="bg-green-500 hover:bg-green-600 focus:ring-green-500">
        Start Lesson
      </Button>

      {/* Helper text when start is disabled */}
      {!canStart && !webGLDisabled && (
        <p className="mt-4 text-sm text-gray-500">Select at least one octave to start</p>
      )}
      {webGLDisabled && (
        <p className="mt-4 text-sm text-red-500">
          3D graphics not supported - lessons unavailable
        </p>
      )}
    </div>
  );
}
