import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="h-10 max-w-xs" />
      <Skeleton className="h-96" />
    </div>
  );
}
