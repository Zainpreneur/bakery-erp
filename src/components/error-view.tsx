"use client";

import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ErrorView({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <span className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <IconAlertTriangle className="size-5" />
        </span>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {onRetry ? (
        <CardContent>
          <Button variant="outline" onClick={onRetry}>
            <IconRefresh className="size-4" /> Try again
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}
