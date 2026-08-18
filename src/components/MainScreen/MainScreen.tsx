// components/MainScreen/MainScreen.tsx

import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { requestMicPermission } from '@/utils/micPermission';
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
    micEnabled,
    toggleOctave,
    setIncludeSharpsFlats,
    setAudioEnabled,
    setShowCorrectAnswer,
    setShowStaffDisplay,
    setMicEnabled,
    isStartEnabled,
  } = useSettingsStore();

  const [micError, setMicError] = useState<string | null>(null);

  const handleMicToggle = async (enabled: boolean) => {
    if (enabled) {
      const result = await requestMicPermission();
      if (!result.granted) {
        setMicError(result.error ?? 'Failed to access microphone.');
        return;
      }
      setMicError(null);
    } else {
      setMicError(null);
    }
    setMicEnabled(enabled);
  };

  // Disable start if no octaves selected OR if WebGL is not supported
  const canStart = isStartEnabled() && !webGLDisabled;

  return (
    <div className="surface-paper min-h-screen flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="font-display text-6xl font-semibold text-ink-900 leading-none">
          Piano 88
        </h1>
        <div className="rule-brass mx-auto mt-4 w-48" />
        <p className="mt-4 text-sm uppercase tracking-[0.25em] text-ink-500">
          Visual and Audio Note Learning
        </p>
      </div>

      {/* Piano visualization with octave selection */}
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-500 text-center mb-4">
          Select octaves to practice
        </p>
        <PianoOverview selectedOctaves={selectedOctaves} onToggleOctave={toggleOctave} />
      </div>

      {/* Settings panel */}
      <div className="mb-10">
        <SettingsPanel
          includeSharpsFlats={includeSharpsFlats}
          audioEnabled={audioEnabled}
          showCorrectAnswer={showCorrectAnswer}
          showStaffDisplay={showStaffDisplay}
          micEnabled={micEnabled}
          onIncludeSharpsFlatsChange={setIncludeSharpsFlats}
          onAudioEnabledChange={setAudioEnabled}
          onShowCorrectAnswerChange={setShowCorrectAnswer}
          onShowStaffDisplayChange={setShowStaffDisplay}
          onMicEnabledChange={handleMicToggle}
          micError={micError}
        />
      </div>

      {/* Start button */}
      <Button
        onClick={onStartLesson}
        disabled={!canStart}
        variant="primary"
        className="px-12 py-4 text-base uppercase tracking-[0.2em]"
      >
        Start Lesson
      </Button>

      {/* Helper text when start is disabled */}
      {!canStart && !webGLDisabled && (
        <p className="mt-4 text-sm text-ink-500">Select at least one octave to start</p>
      )}
      {webGLDisabled && (
        <p className="mt-4 text-sm text-felt-600">
          3D graphics not supported - lessons unavailable
        </p>
      )}
    </div>
  );
}
