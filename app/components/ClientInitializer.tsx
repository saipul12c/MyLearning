"use client";

import { useEffect } from "react";
import { initReviewsSeed } from "@/lib/reviews";

export default function ClientInitializer() {
  useEffect(() => {
    // Initialize common data seeds on client side
    initReviewsSeed();
  }, []);

  return null;
}
