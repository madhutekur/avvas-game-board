import React from "react";

export default class ErrorBoundary extends React.Component<any, { error: unknown }> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown, info: any) {
    // also log to console
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
          <h2>Fatal error — debug info below</h2>
          <pre>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
