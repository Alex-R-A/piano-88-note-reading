export async function requestMicPermission(): Promise<{
  granted: boolean;
  error?: string;
}> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      return { granted: false, error: 'Microphone access denied. Check browser permissions.' };
    }
    if (err instanceof DOMException && err.name === 'NotFoundError') {
      return { granted: false, error: 'No microphone found.' };
    }
    return { granted: false, error: 'Failed to access microphone.' };
  }
}
