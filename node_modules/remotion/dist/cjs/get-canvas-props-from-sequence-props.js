"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCanvasPropsFromSequenceProps = void 0;
const getCanvasPropsFromSequenceProps = (props) => {
    const canvasProps = {};
    const mutableCanvasProps = canvasProps;
    for (const key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key) &&
            (key.startsWith('data-') || key.startsWith('aria-'))) {
            mutableCanvasProps[key] = props[key];
        }
    }
    return canvasProps;
};
exports.getCanvasPropsFromSequenceProps = getCanvasPropsFromSequenceProps;
