import { Suspense } from "react";
import { RoomView } from "@/components/room/RoomView";

/**
 * The room detail screen. The room id travels as a `?r=<id>` query param
 * (read client-side by RoomView) rather than a path segment, so the whole
 * app exports to fully static hosting and works for any room a visitor
 * creates — not only the ones known at build time.
 */
export default function RoomPage() {
  return (
    <Suspense>
      <RoomView />
    </Suspense>
  );
}
