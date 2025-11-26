"use client";

import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // Initial mock chains configuration for local development
  // When chainId=31337 and fhevm_relayer_metadata exists, 
  // FHEVM instance will use @fhevm/mock-utils
  const initialMockChains = {
    31337: "http://localhost:8545",
  };

  // Pass mock chains to components via context if needed
  // For now, components will use useFhevm hook directly

  return <>{children}</>;
}

