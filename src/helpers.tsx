import { Platform, PlatformIOSStatic } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import Constants from 'expo-constants';
import { DeviceMotion } from 'expo-sensors';

import Huds0nError from '@huds0n/error';
import { onMount, onDismount, useId } from '@huds0n/utilities';

import { Orientation } from './types';

const {
  DEFAULT,
  ALL,
  PORTRAIT,
  PORTRAIT_DOWN,
  PORTRAIT_UP,
  LANDSCAPE,
  LANDSCAPE_LEFT,
  LANDSCAPE_RIGHT,
} = ScreenOrientation.OrientationLock;

const OrientationLockPriority = {
  DEFAULT: [DEFAULT, null],
  ALL: [ALL, null],
  PORTRAIT: [PORTRAIT, PORTRAIT_UP],
  PORTRAIT_DOWN: [PORTRAIT_DOWN, null],
  PORTRAIT_UP: [PORTRAIT_UP, PORTRAIT],
  LANDSCAPE: [LANDSCAPE, LANDSCAPE_LEFT],
  LANDSCAPE_LEFT: [LANDSCAPE_LEFT, LANDSCAPE],
  LANDSCAPE_RIGHT: [LANDSCAPE_RIGHT, LANDSCAPE],
};

async function getLockNum(
  orientation: Orientation | null,
): Promise<number | null> {
  if (!orientation) {
    return null;
  }

  if (orientation === 'CURRENT') {
    return getLockNum(await getDeviceOrientation());
  }

  const [primaryLock, secondaryLock] = OrientationLockPriority[orientation];

  if (
    primaryLock !== null &&
    (await ScreenOrientation.supportsOrientationLockAsync(primaryLock))
  ) {
    return primaryLock;
  }

  if (
    secondaryLock !== null &&
    (await ScreenOrientation.supportsOrientationLockAsync(secondaryLock))
  ) {
    return secondaryLock;
  }

  return null;
}

export function getDeviceOrientation() {
  return new Promise<Orientation | null>(async (resolve) => {
    if (Constants.isDevice && (await DeviceMotion.isAvailableAsync())) {
      const listener = DeviceMotion.addListener(
        ({ accelerationIncludingGravity: { x, y, z } }) => {
          listener.remove();

          if (
            Math.pow(x, 2) > Math.pow(y, 2) &&
            Math.pow(x, 2) > Math.pow(z, 2)
          ) {
            resolve(x > 0 ? 'LANDSCAPE_LEFT' : 'LANDSCAPE_RIGHT');
          }

          if (
            Math.pow(y, 2) > Math.pow(x, 2) &&
            Math.pow(y, 2) > Math.pow(z, 2)
          ) {
            resolve(y > 0 ? 'PORTRAIT_DOWN' : 'PORTRAIT_UP');
          }

          return resolve(null);
        },
      );
    } else {
      resolve(null);
    }
  });
}

type LockId = symbol | string;
const lockMap: Map<LockId, number> = new Map();

function getCurrentOrientationLock() {
  if (!lockMap.size) {
    return 0;
  }

  return [...lockMap.values()][lockMap.size - 1];
}

export async function lockScreen(
  id: LockId,
  orientation: Orientation = 'CURRENT',
) {
  checkManifest();

  // This forces screen to rotate to current orientation on lock change
  if (orientation === 'ALL' || orientation === 'DEFAULT') {
    await lockScreen(id, 'CURRENT');
  }

  const lockNum = await getLockNum(orientation);

  if (lockNum !== null) {
    await ScreenOrientation.lockAsync(lockNum);
    lockMap.set(id, lockNum);
    return true;
  }

  return false;
}

export async function unlockScreen(id: LockId) {
  lockMap.delete(id);

  const newLock = getCurrentOrientationLock();

  if (newLock === 0 || newLock === 1) {
    const lockNum = await getLockNum(await getDeviceOrientation());
    lockNum && (await ScreenOrientation.lockAsync(lockNum));
  }

  await ScreenOrientation.lockAsync(newLock);
}

export function useOrientationLock(orientation?: Orientation) {
  const id = useId('lockId');

  onMount(() => {
    orientation && lockScreen(id, orientation);
  });

  onDismount(() => {
    unlockScreen(id);
  });

  return {
    lockScreen: (orientationLock?: Orientation) =>
      lockScreen(id, orientationLock),
    unlockScreen: () => unlockScreen(id),
  };
}

function checkManifest() {
  if (
    (Platform as PlatformIOSStatic).isPad &&
    !Constants.manifest?.ios?.requireFullScreen
  ) {
    new Huds0nError({
      name: 'Huds0nError',
      code: 'MISSING_ORIENTATION_PERMISSIONS',
      message:
        'requireFullScreen required in app.json to use orientation lock on iPad. See https://docs.expo.io/versions/latest/sdk/screen-orientation/#screenorientationsupportsorientationlockasyncorientationlock',
      severity: 'LOW',
    }).log();
  }
}
