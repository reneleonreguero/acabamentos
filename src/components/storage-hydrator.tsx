"use client";

import { useEffect } from "react";
import { hydrateStorage } from "@/lib/storage";

export function StorageHydrator() {
  useEffect(hydrateStorage, []);
  return null;
}