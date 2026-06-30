import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      window.localStorage.clear();
      window.location.href = '/';
    } catch (e) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: 24,
            background: '#0f172a',
            color: '#e2e8f0',
            fontFamily: 'system-ui, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}
        >
          <div style={{ maxWidth: 600, width: '100%' }}>
            <h1 style={{ fontSize: 28, marginBottom: 16, color: '#fff' }}>Something went wrong</h1>
            <p style={{ marginBottom: 24, color: '#94a3b8' }}>
              LegalEase encountered an unexpected error. This often happens due to stale browser data.
            </p>
            <pre
              style={{
                padding: 16,
                background: '#1e293b',
                borderRadius: 8,
                overflow: 'auto',
                fontSize: 14,
                textAlign: 'left',
                marginBottom: 24,
                border: '1px solid #334155'
              }}
            >
              {this.state.error.message}
            </pre>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 24px',
                  background: '#334155',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  background: '#d4af37',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Clear Session & Fix
              </button>
            </div>
            <p style={{ marginTop: 24, fontSize: 13, color: '#64748b' }}>
              If the problem persists, please try accessing in Incognito mode or contact support.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
