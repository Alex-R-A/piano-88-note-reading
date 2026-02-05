// hooks/index.ts
export {
  useLessonEngine,
  FEEDBACK_FLASH_DURATION,
  FEEDBACK_FADE_DURATION,
  SHOW_ANSWER_DURATION,
  TOTAL_FEEDBACK_TIME,
  TOTAL_INCORRECT_WITH_ANSWER_TIME,
} from './useLessonEngine';
export type { UseLessonEngineReturn, LessonEngineStats } from './useLessonEngine';

export { useVexFlow } from './useVexFlow';

export { useAudio, useAudioCleanup } from './useAudio';
export type { UseAudioReturn } from './useAudio';

export { useMicInput } from './useMicInput';
export type { UseMicInputReturn, MicState } from './useMicInput';
