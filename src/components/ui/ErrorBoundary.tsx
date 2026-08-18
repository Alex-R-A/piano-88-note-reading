// components/ui/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary for catching render errors.
 * Per spec line 1000: wrap R3F Canvas to handle WebGL errors gracefully.
 */
export class WebGLErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('WebGL Error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-100 border border-gray-300 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            3D Rendering Error
          </h2>
          <p className="text-sm text-gray-600 text-center max-w-md">
            Your browser doesn't support 3D graphics. Please use a modern browser
            like Chrome, Firefox, or Edge.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
