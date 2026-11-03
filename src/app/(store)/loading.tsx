import { Monogram } from "@/components/brand/Logo";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true" aria-label="Loading">
      <Monogram className="h-16 w-auto animate-pulse" />
    </div>
  );
}
