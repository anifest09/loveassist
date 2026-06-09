// Native Apple Sign In helper — iOS only.
// Safely no-ops on Android & web. Returns null instead of throwing on cancel.
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

export type AppleAuthResult = {
  identity_token: string;
  nonce: string;
  full_name?: { givenName?: string | null; familyName?: string | null } | null;
  email?: string | null;
};

export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInWithApple(): Promise<AppleAuthResult | null> {
  if (Platform.OS !== "ios") {
    throw new Error("Apple Sign In is only available on iOS.");
  }
  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error("Apple Sign In is not available on this device.");
  }

  // Generate a random nonce; we send the raw value, Apple includes its SHA256 hash
  // in the JWT 'nonce' claim. Backend verifies either form.
  const nonceSource = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    nonceSource,
  );

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error("Apple did not return an identity token.");
    }
    return {
      identity_token: credential.identityToken,
      // We send the RAW nonce; backend will hash + compare.
      nonce: nonceSource,
      full_name: credential.fullName
        ? {
            givenName: credential.fullName.givenName,
            familyName: credential.fullName.familyName,
          }
        : null,
      email: credential.email,
    };
  } catch (e: any) {
    if (e?.code === "ERR_REQUEST_CANCELED" || e?.code === "ERR_CANCELED") {
      return null; // user cancelled — treat as no-op
    }
    throw e;
  }
}
