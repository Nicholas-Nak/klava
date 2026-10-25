import { Component, type ReactNode } from 'react';
import styles from './ChartBoundary.module.css';

export class ChartBoundary extends Component<{ children: ReactNode }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className={styles.error} role="status">
          <p>Не вдалося показати графік.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Оновити сторінку
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
