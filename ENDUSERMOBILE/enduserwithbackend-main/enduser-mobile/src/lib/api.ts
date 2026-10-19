
import Constants from "expo-constants";
import { Platform } from "react-native";

const explicitBase = process.env.EXPO_PUBLIC_API_BASE?.trim();

function inferHostFromExpo(): string | null {
  const debuggerHost =
    Constants.expoConfig?.hostUri ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;

  if (!debuggerHost || typeof debuggerHost !== "string") {
    return null;
  }

  return debuggerHost.split(":")[0] || null;
}

function getApiBase(): string {
  if (explicitBase) {
    return explicitBase.replace(/\/+$/, "");
  }

  const expoHost = inferHostFromExpo();
  if (expoHost) {
    return `http://${expoHost}:3001/api/v1`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3001/api/v1";
  }

  return "http://localhost:3001/api/v1";
}

export const API_BASE = getApiBase();
