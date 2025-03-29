import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 bg-error bg-opacity-10 rounded-md border border-error">
          <h3 className="text-lg font-semibold text-error mb-2">Something went wrong</h3>
          <p className="mb-4">There was an error loading this component. You can try:</p>
          <ul className="list-disc list-inside mb-4">
            <li>Refreshing the page</li>
            <li>Checking your network connection</li>
            <li>Logging out and back in</li>
          </ul>
          <details className="mt-2 text-sm opacity-70">
            <summary>Error details</summary>
            <p className="mt-1">{this.state.error?.toString()}</p>
            <pre className="bg-base-300 p-2 rounded mt-2 overflow-x-auto">
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          <button 
            className="btn btn-sm btn-primary mt-4"
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 