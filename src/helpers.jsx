"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOrientationLock = exports.unlockScreen = exports.lockScreen = exports.getDeviceOrientation = void 0;
const tslib_1 = require("tslib");
const react_native_1 = require("react-native");
const ScreenOrientation = (0, tslib_1.__importStar)(require("expo-screen-orientation"));
const expo_constants_1 = (0, tslib_1.__importDefault)(require("expo-constants"));
const expo_sensors_1 = require("expo-sensors");
const error_1 = (0, tslib_1.__importDefault)(require("@huds0n/error"));
const utilities_1 = require("@huds0n/utilities");
const { DEFAULT, ALL, PORTRAIT, PORTRAIT_DOWN, PORTRAIT_UP, LANDSCAPE, LANDSCAPE_LEFT, LANDSCAPE_RIGHT, } = ScreenOrientation.OrientationLock;
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
async function getLockNum(orientation) {
    if (!orientation) {
        return null;
    }
    if (orientation === "CURRENT") {
        return getLockNum(await getDeviceOrientation());
    }
    const [primaryLock, secondaryLock] = OrientationLockPriority[orientation];
    if (primaryLock !== null &&
        (await ScreenOrientation.supportsOrientationLockAsync(primaryLock))) {
        return primaryLock;
    }
    if (secondaryLock !== null &&
        (await ScreenOrientation.supportsOrientationLockAsync(secondaryLock))) {
        return secondaryLock;
    }
    return null;
}
function getDeviceOrientation() {
    return new Promise(async (resolve) => {
        if (expo_constants_1.default.isDevice && (await expo_sensors_1.DeviceMotion.isAvailableAsync())) {
            const listener = expo_sensors_1.DeviceMotion.addListener(({ accelerationIncludingGravity: { x, y, z } }) => {
                listener.remove();
                if (Math.pow(x, 2) > Math.pow(y, 2) &&
                    Math.pow(x, 2) > Math.pow(z, 2)) {
                    resolve(x > 0 ? "LANDSCAPE_LEFT" : "LANDSCAPE_RIGHT");
                }
                if (Math.pow(y, 2) > Math.pow(x, 2) &&
                    Math.pow(y, 2) > Math.pow(z, 2)) {
                    resolve(y > 0 ? "PORTRAIT_DOWN" : "PORTRAIT_UP");
                }
                return resolve(null);
            });
        }
        else {
            resolve(null);
        }
    });
}
exports.getDeviceOrientation = getDeviceOrientation;
const lockMap = new Map();
function getCurrentOrientationLock() {
    if (!lockMap.size) {
        return 0;
    }
    return [...lockMap.values()][lockMap.size - 1];
}
async function lockScreen(id, orientation = "CURRENT") {
    checkManifest();
    if (orientation === "ALL" || orientation === "DEFAULT") {
        await lockScreen(id, "CURRENT");
    }
    const lockNum = await getLockNum(orientation);
    if (lockNum !== null) {
        await ScreenOrientation.lockAsync(lockNum);
        lockMap.set(id, lockNum);
        return true;
    }
    return false;
}
exports.lockScreen = lockScreen;
async function unlockScreen(id) {
    lockMap.delete(id);
    const newLock = getCurrentOrientationLock();
    if (newLock === 0 || newLock === 1) {
        const lockNum = await getLockNum(await getDeviceOrientation());
        lockNum && (await ScreenOrientation.lockAsync(lockNum));
    }
    await ScreenOrientation.lockAsync(newLock);
}
exports.unlockScreen = unlockScreen;
function useOrientationLock(orientation) {
    const id = (0, utilities_1.useId)("lockId");
    (0, utilities_1.onMount)(() => {
        orientation && lockScreen(id, orientation);
    });
    (0, utilities_1.onDismount)(() => {
        unlockScreen(id);
    });
    return {
        lockScreen: (orientationLock) => lockScreen(id, orientationLock),
        unlockScreen: () => unlockScreen(id),
    };
}
exports.useOrientationLock = useOrientationLock;
function checkManifest() {
    if (react_native_1.Platform.isPad &&
        !expo_constants_1.default.manifest?.ios?.requireFullScreen) {
        new error_1.default({
            name: "Huds0nError",
            code: "MISSING_ORIENTATION_PERMISSIONS",
            message: "requireFullScreen required in app.json to use orientation lock on iPad. See https://docs.expo.io/versions/latest/sdk/screen-orientation/#screenorientationsupportsorientationlockasyncorientationlock",
            severity: "LOW",
        }).log();
    }
}
