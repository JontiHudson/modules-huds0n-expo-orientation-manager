"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrientationManager = void 0;
const utilities_1 = require("@huds0n/utilities");
const helpers_1 = require("./helpers");
exports.OrientationManager = {
    getOrientation: helpers_1.getDeviceOrientation,
    lock: helpers_1.lockScreen,
    unlock: helpers_1.unlockScreen,
    useLock: helpers_1.useOrientationLock,
    useOrientation: utilities_1.useOrientation,
};
