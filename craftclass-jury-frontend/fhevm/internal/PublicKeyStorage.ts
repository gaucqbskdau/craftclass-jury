// Local storage for FHEVM public keys (per ACL address)
const STORAGE_PREFIX = "fhevm.publicKey.";

interface StoredPublicKey {
  publicKey: string;
  publicParams: string;
  timestamp: number;
}

export async function publicKeyStorageGet(aclAddress: string): Promise<{
  publicKey: string;
  publicParams: string;
}> {
  const key = `${STORAGE_PREFIX}${aclAddress.toLowerCase()}`;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed: StoredPublicKey = JSON.parse(stored);
      return {
        publicKey: parsed.publicKey,
        publicParams: parsed.publicParams,
      };
    }
  } catch (error) {
    console.warn("Failed to retrieve public key from storage:", error);
  }

  // Return empty strings to trigger fresh key generation
  return {
    publicKey: "",
    publicParams: "",
  };
}

export async function publicKeyStorageSet(
  aclAddress: string,
  publicKey: string,
  publicParams: string
): Promise<void> {
  const key = `${STORAGE_PREFIX}${aclAddress.toLowerCase()}`;

  const data: StoredPublicKey = {
    publicKey,
    publicParams,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to store public key:", error);
  }
}

export function publicKeyStorageClear(aclAddress?: string): void {
  if (aclAddress) {
    const key = `${STORAGE_PREFIX}${aclAddress.toLowerCase()}`;
    localStorage.removeItem(key);
  } else {
    // Clear all FHEVM public keys
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}

