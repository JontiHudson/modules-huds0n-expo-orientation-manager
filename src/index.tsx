import { useOrientation } from "@huds0n/utilities";

import {
  getDeviceOrientation,
  lockScreen,
  unlockScreen,
  useOrientationLock,
} from "./helpers";

export const OrientationManager = {
  getOrientation: getDeviceOrientation,
  lock: lockScreen,
  unlock: unlockScreen,
  useLock: useOrientationLock,
  useOrientation,
};

export type { Types as OrientationTypes } from "./types";
