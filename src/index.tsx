import { useOrientation } from '@huds0n/utilities';

import {
  getDeviceOrientation,
  lockScreen,
  unlockScreen,
  useOrientationLock,
} from './helpers';

import * as Types from './types';

export namespace OrientationManager {
  export type Orientation = Types.Orientation;
}

export const OrientationManager = {
  getOrientation: getDeviceOrientation,
  lock: lockScreen,
  unlock: unlockScreen,
  useLock: useOrientationLock,
  useOrientation,
};
