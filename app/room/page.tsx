import { Suspense } from "react";
import type { Metadata } from "next";
import { RoomView } from "@/components/room/RoomView";
import { RoomSkeleton } from "@/components/skeletons/RouteSkeletons";

export const metadata: Metadata = {
  title: "Room",
  description: "A room in your palace, with its objects laid out spatially.",
};

/**
 * The room detail screen. The room id travels as a `?r=<id>` query param
 * (read client-side by RoomView) rather than a path segment, so the whole
 * app exports to fully static hosting and works for any room a visitor
 * creates — not only the ones known at build time.
 *
 * The `<Suspense>` boundary is required: `RoomView` calls `useSearchParams()`.
 */
export default function RoomPage() {
  return (
    <Suspense fallback={<RoomSkeleton />}>
      <RoomView />
    </Suspense>
  );
}
