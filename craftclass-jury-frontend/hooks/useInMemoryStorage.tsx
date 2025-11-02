"use client";

import { useState, useEffect } from "react";
import { GenericStringInMemoryStorage, GenericStringStorage } from "@/fhevm/GenericStringStorage";

export function useInMemoryStorage() {
  const [storage] = useState<GenericStringStorage>(() => new GenericStringInMemoryStorage());
  
  return { storage };
}


