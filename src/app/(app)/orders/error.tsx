'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      message={error.message || 'An unexpected error interrupted this page.'}
      onRetry={retry}
    />
  );
}
