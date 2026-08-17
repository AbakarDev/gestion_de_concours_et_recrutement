import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Affiche l’erreur au lieu d’un écran blanc (fréquent sur Expo Go). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, backgroundColor: '#FEF2F2' }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#991B1B', marginBottom: 12 }}>
          L’application a planté
        </Text>
        <Text style={{ color: '#7F1D1D', fontFamily: 'monospace' }}>
          {this.state.error.message}
        </Text>
      </ScrollView>
    );
  }
}
