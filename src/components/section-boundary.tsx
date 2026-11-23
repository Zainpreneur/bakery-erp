"use client";

import * as React from "react";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  children: React.ReactNode;
  /** Shaped placeholder shown by the parent while data is loading. */
  skeleton?: React.ReactNode;
  loading?: boolean;
  title?: string;
  onRetry?: () => void;
  className?: string;
};

type State = { error: Error | null };

/** Keeps one broken/ slowly-loading dashboard section from blanking the page. */
export class SectionBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Dashboard section failed:", error);
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.props.loading && this.props.skeleton) return <>{this.props.skeleton}</>;
    if (this.state.error) {
      return (
        <Card className={this.props.className}>
          <CardHeader>
            <span className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <IconAlertTriangle className="size-4" />
            </span>
            <CardTitle>{this.props.title ?? "This section"}</CardTitle>
            <CardDescription>{this.state.error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={this.reset}>
              <IconRefresh className="size-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      );
    }
    return <>{this.props.children}</>;
  }
}
