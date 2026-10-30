import i18n from "@/lib/i18n";
import { getState } from "@/lib/storage/store";
import { NativeModules } from "react-native";
import { clearSimRuntime } from "./simRuntime";

const { MockLocation } = NativeModules as {
  MockLocation?: {
    startMocking: (lat: number, lng: number, alt: number) => Promise<void>;
    updateLocation: (lat: number, lng: number, alt: number) => Promise<void>;
    stopMocking: () => Promise<void>;
  };
};

export const MOCK_ALTITUDE = 50;

type MockUpdateHandler = (lat: number, lng: number) => void;
type BackgroundController = {
  start: () => void;
  stop: () => void;
};

let updateHandler: MockUpdateHandler | null = null;
let backgroundController: BackgroundController | null = null;
let lastMockError: string | null = null;
let mockEnabled = false;
let holding = false;
let mockPosition: [number, number] | null = null;

export function isMockModuleAvailable() {
  return !!MockLocation?.startMocking;
}

export function getLastMockError() {
  return lastMockError;
}

export function setMockUpdateHandler(handler: MockUpdateHandler | null) {
  updateHandler = handler;
}

export function callMockUpdate(lat: number, lng: number) {
  updateHandler?.(lat, lng);
}

export function setBackgroundController(controller: BackgroundController | null) {
  backgroundController = controller;
}

export function isMockEnabled() {
  return mockEnabled;
}

export function isMockHolding() {
  return holding;
}

export function getMockPosition() {
  return mockPosition;
}

async function ensureNativeStarted(lat: number, lng: number) {
  if (!MockLocation?.startMocking) {
    throw new Error(i18n.t("mock_module_unavailable"));
  }
  try {
    await MockLocation.startMocking(lat, lng, MOCK_ALTITUDE);
  } catch (error) {
    lastMockError =
      error instanceof Error ? error.message : String(error ?? "unbekannt");
    throw error;
  }
  lastMockError = null;
}

async function pushNativeUpdate(lat: number, lng: number) {
  if (!MockLocation?.updateLocation) return;
  try {
    await MockLocation.updateLocation(lat, lng, MOCK_ALTITUDE);
  } catch {
    // Do not surface update errors – the position will be retried on the next tick
  }
}

async function ensureNativeStopped() {
  if (!MockLocation?.stopMocking) return;
  try {
    await MockLocation.stopMocking();
  } catch {
    // ignore
  }
}

export async function enableMock(lat: number, lng: number) {
  holding = false;
  await ensureNativeStarted(lat, lng);
  mockPosition = [lng, lat];
  mockEnabled = true;
  getState().setMockActive(true);
}

export async function setMockPosition(lat: number, lng: number, hold = false) {
  holding = hold;
  mockPosition = [lng, lat];
  if (!mockEnabled) {
    await ensureNativeStarted(lat, lng);
    mockEnabled = true;
    getState().setMockActive(true);
  } else {
    await pushNativeUpdate(lat, lng);
  }
}

export function holdMock() {
  holding = true;
}

export async function disableMock() {
  mockEnabled = false;
  holding = false;
  mockPosition = null;
  getState().setMockActive(false);
  void clearSimRuntime();
  backgroundController?.stop();
  await ensureNativeStopped();
}

export function feedMock(lat: number, lng: number) {
  if (!mockEnabled) return;
  // Only an actively running simulation needs background location updates.
  backgroundController?.start();
  callMockUpdate(lat, lng);
}

export function feedMockIfActive(coord: [number, number]) {
  feedMock(coord[1], coord[0]);
}
