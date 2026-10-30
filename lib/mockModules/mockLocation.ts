import i18n from "../i18n";
import {
  disableMock,
  enableMock,
  feedMockIfActive,
  getLastMockError,
  getMockPosition,
  holdMock,
  isMockEnabled,
  isMockModuleAvailable,
  setMockPosition,
  setMockUpdateHandler,
} from "./mockLocationController";

export const MOCK_ALTITUDE = 50;

setMockUpdateHandler((lat, lng) => {
  void setMockPosition(lat, lng);
});

export function startMock(lat: number, lng: number) {
  return enableMock(lat, lng);
}

export async function updateMock(lat: number, lng: number) {
  await setMockPosition(lat, lng);
}

export async function stopMock() {
  await disableMock();
}

export async function ensureMockAt(coordinate: [number, number]) {
  try {
    await setMockPosition(coordinate[1], coordinate[0]);
    return true;
  } catch {
    return false;
  }
}

export function mockErrorMessage() {
  if (!isMockModuleAvailable()) {
    return i18n.t("mock_module_unavailable");
  }
  const detail = getLastMockError();
  const details = detail ? i18n.t("mock_details", { detail }) : "";
  return i18n.t("mock_start_failed", { details });
}

export { feedMockIfActive, isMockEnabled, isMockModuleAvailable };
export { getMockPosition, holdMock, setMockPosition };
