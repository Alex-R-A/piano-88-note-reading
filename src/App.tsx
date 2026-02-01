// App.tsx

import { useState } from 'react';
import { MainScreen } from '@/components/MainScreen';
import type { Screen } from '@/types';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');

  const handleStartLesson = () => {
    setCurrentScreen('lesson');
  };

  const handleEndLesson = () => {
    setCurrentScreen('analytics');
  };

  const handleBackToMain = () => {
    setCurrentScreen('main');
  };

  switch (currentScreen) {
    case 'main':
      return <MainScreen onStartLesson={handleStartLesson} />;

    case 'lesson':
      // Placeholder for LessonScreen - will be implemented in Step 5-7
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Lesson Screen (Coming Soon)</h1>
          <button
            onClick={handleEndLesson}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Stop Lesson
          </button>
        </div>
      );

    case 'analytics':
      // Placeholder for AnalyticsScreen - will be implemented in Step 9
      return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Analytics Screen (Coming Soon)</h1>
          <button
            onClick={handleBackToMain}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Main Menu
          </button>
        </div>
      );

    default:
      return null;
  }
}

export default App;
