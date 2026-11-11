"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNativeFilePickerPosition = void 0;
const getNativeFilePickerPosition = () => {
    const { screenX, screenY, outerWidth, outerHeight } = window;
    if (![screenX, screenY, outerWidth, outerHeight].every(Number.isFinite) ||
        outerWidth <= 0 ||
        outerHeight <= 0) {
        return null;
    }
    return { x: screenX + outerWidth / 2, y: screenY + outerHeight / 2 };
};
exports.getNativeFilePickerPosition = getNativeFilePickerPosition;
