"use client";

import { useEffect } from "react";
import { trackVisit } from "./ProgressDashboard";

export default function PageTracker({ pageSlug }: { pageSlug: string }) {
  useEffect(() => {
    trackVisit(pageSlug);
  }, [pageSlug]);

  return null;
}
