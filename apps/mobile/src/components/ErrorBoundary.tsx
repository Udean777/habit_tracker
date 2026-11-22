import { Component, type ErrorInfo, type ReactNode } from "react";
import { View } from "react-native";
import { Button } from "./Button";
import { Text } from "./Text";

type Props = {
  readonly children: ReactNode;
};

type State = {
  readonly hasError: boolean;
  readonly message: string;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("App ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center gap-4 bg-white p-6">
          <Text variant="title">Something went wrong</Text>
          <Text variant="caption" className="text-center">
            {this.state.message || "An unexpected error occurred."}
          </Text>
          <Button
            label="Try Again"
            onPress={() => this.setState({ hasError: false, message: "" })}
          />
        </View>
      );
    }
    return this.props.children;
  }
}
