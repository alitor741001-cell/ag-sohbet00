import React from 'react';

/**
 * Oyun içinde beklenmedik bir hata olursa ekran siyah kalmaz: oyun bir kez
 * kendiliğinden yeniden kurulur, yine olmazsa "Tekrar dene" düğmesi gösterilir.
 */
export default class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false, attempt: 0 };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Oyun hatası:', error);
    if (this.state.attempt === 0) {
      window.setTimeout(() => this.setState({ failed: false, attempt: 1 }), 0);
    }
  }

  retry = () => this.setState((state) => ({ failed: false, attempt: state.attempt + 1 }));

  render() {
    const { failed, attempt } = this.state;
    if (failed && attempt > 0) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-slot p-4 text-center text-slot-text">
          <p className="text-sm font-bold">Oyun açılamadı.</p>
          <div className="flex gap-2">
            <button type="button" onClick={this.retry} className="min-h-11 rounded-xl bg-slot-gold px-4 font-black text-slot">Tekrar dene</button>
            <button type="button" onClick={this.props.onExit} className="min-h-11 rounded-xl border border-slot-gold/40 px-4">Geri dön</button>
          </div>
        </div>
      );
    }
    if (failed) return null;
    return <React.Fragment key={attempt}>{this.props.children}</React.Fragment>;
  }
}