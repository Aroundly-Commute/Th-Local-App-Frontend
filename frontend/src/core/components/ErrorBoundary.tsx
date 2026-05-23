import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong!</Text>
          <Text style={styles.subtitle}>The app encountered a critical error. Please take a screenshot of this page for debugging.</Text>
          
          <ScrollView style={styles.scroll}>
            <Text style={styles.errorText}>{this.state.error && this.state.error.toString()}</Text>
            {this.state.errorInfo && (
              <Text style={styles.stackText}>{this.state.errorInfo.componentStack}</Text>
            )}
          </ScrollView>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  scroll: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  stackText: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
