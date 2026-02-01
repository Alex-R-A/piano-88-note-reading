// App.tsx
import { useState, useEffect, useCallback } from 'react';
import { MainScreen } from '@/components/MainScreen';
import { LessonScreen } from '@/components/LessonScreen';
import { AnalyticsScreen } from '@/components/AnalyticsScreen';
import { useLessonStore } from '@/stores/lessonStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { generateNoteSet } from '@/utils/noteUtils';
import { initAudio, resumeAudioContext } from '@/utils/audioPlayer';
import type { Screen } from '@/types';

// Minimum viewport width per spec line 168
const MIN_VIEWPORT_WIDTH = 768;

/**
 * Check if WebGL is supported in the browser.
 * Per spec line 1000: show message for unsupported browsers.
 */
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Viewport warning component for narrow screens.
 */
function ViewportWarning() {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          Larger Screen Recommended
        </h2>
        <p className="text-gray-600">
          This application works best on screens at least 768px wide.
          Please use a tablet or desktop device for the optimal experience.
        </p>
      </div>
    </div>
  );
}

/**
 * WebGL not supported warning.
 */
function WebGLWarning() {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          3D Graphics Not Supported
        </h2>
        <p className="text-gray-600">
          Your browser doesn't support 3D graphics (WebGL). Please use a modern
          browser like Chrome, Firefox, or Edge.
        </p>
      </div>
    </div>
  );
}

/**
 * Audio blocked notice component.
 * Per spec line 1002: show "Click to enable sound" notice.
 */
function AudioBlockedNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg cursor-pointer z-40 max-w-xs"
      onClick={onDismiss}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onDismiss()}
    >
      <p className="text-sm text-yellow-800">
        Click anywhere to enable sound
      </p>
    </div>
  );
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showViewportWarning, setShowViewportWarning] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [showAudioNotice, setShowAudioNotice] = useState(false);
  const [audioContextResumed, setAudioContextResumed] = useState(false);

  // Store access
  const startLesson = useLessonStore((state) => state.startLesson);
  const resetLesson = useLessonStore((state) => state.endLesson);
  const { selectedOctaves, includeSharpsFlats, audioEnabled } = useSettingsStore();

  // Check WebGL support on mount
  useEffect(() => {
    setWebGLSupported(isWebGLSupported());
  }, []);

  // Check viewport width on mount and resize
  useEffect(() => {
    function checkViewport() {
      setShowViewportWarning(window.innerWidth < MIN_VIEWPORT_WIDTH);
    }

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Show audio notice if audio is enabled but not yet user-activated
  useEffect(() => {
    if (audioEnabled && !audioContextResumed) {
      setShowAudioNotice(true);
    } else {
      setShowAudioNotice(false);
    }
  }, [audioEnabled, audioContextResumed]);

  // Handle user interaction to resume AudioContext
  useEffect(() => {
    if (audioContextResumed) return;

    function handleUserInteraction() {
      setAudioContextResumed(true);
      setShowAudioNotice(false);
    }

    // Listen for first user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [audioContextResumed]);

  /**
   * Navigate to a new screen with transition animation.
   */
  const navigateTo = useCallback((screen: Screen) => {
    setIsTransitioning(true);
    // Allow fade-out to complete before changing screen
    setTimeout(() => {
      setCurrentScreen(screen);
      setIsTransitioning(false);
    }, 150);
  }, []);

  /**
   * Handle starting a lesson from MainScreen.
   * Generates note set and initializes lesson state before transitioning.
   * Also initializes audio since this is triggered by user gesture (click).
   */
  const handleStartLesson = useCallback(async () => {
    console.log('[App] Starting lesson, initializing audio first...');

    // Initialize audio now (user gesture context from button click)
    if (audioEnabled) {
      try {
        await initAudio();
        await resumeAudioContext();
        console.log('[App] Audio initialized successfully');
      } catch (err) {
        console.error('[App] Audio init failed:', err);
      }
    }

    // Generate note set from current settings
    const noteSet = generateNoteSet([...selectedOctaves], includeSharpsFlats);

    // Start the lesson with generated notes
    startLesson(noteSet);

    // Navigate to lesson screen
    navigateTo('lesson');
  }, [selectedOctaves, includeSharpsFlats, startLesson, navigateTo, audioEnabled]);

  /**
   * Handle ending lesson from LessonScreen.
   * Transitions to analytics screen.
   */
  const handleEndLesson = useCallback(() => {
    navigateTo('analytics');
  }, [navigateTo]);

  /**
   * Handle returning to main menu from AnalyticsScreen.
   * Resets lesson state.
   */
  const handleBackToMain = useCallback(() => {
    resetLesson();
    navigateTo('main');
  }, [resetLesson, navigateTo]);

  // Render screen content based on current screen
  function renderScreen() {
    switch (currentScreen) {
      case 'main':
        return (
          <MainScreen
            onStartLesson={handleStartLesson}
            webGLDisabled={!webGLSupported}
          />
        );

      case 'lesson':
        return <LessonScreen onEndLesson={handleEndLesson} />;

      case 'analytics':
        return <AnalyticsScreen onBackToMain={handleBackToMain} />;

      default:
        return null;
    }
  }

  return (
    <>
      {/* Viewport warning overlay */}
      {showViewportWarning && <ViewportWarning />}

      {/* WebGL warning overlay */}
      {!webGLSupported && <WebGLWarning />}

      {/* Audio blocked notice */}
      {showAudioNotice && (
        <AudioBlockedNotice onDismiss={() => setShowAudioNotice(false)} />
      )}

      {/* Main content with screen transitions */}
      <div
        className={`screen-transition ${isTransitioning ? 'screen-exit' : 'screen-enter'}`}
      >
        {renderScreen()}
      </div>
    </>
  );
}

export default App;
