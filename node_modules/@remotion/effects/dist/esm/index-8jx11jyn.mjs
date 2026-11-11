import {
  parseColorRgba
} from "./index-wxhvgv2s.mjs";
import {
  setupWebGpuSinglePass
} from "./index-tvfexb7s.mjs";

// src/webgpu-color-state.ts
var setupWebGpuColors = (target, label) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const colorContext = canvas.getContext("2d", { willReadFrequently: true });
  if (!colorContext)
    throw new Error("Failed to acquire 2D context for color parsing");
  return { ...setupWebGpuSinglePass(target, label), colorContext, colors: null };
};
var getWebGpuColors = (state, colors) => {
  const key = JSON.stringify(colors);
  if (state.colors?.key === key)
    return state.colors.data;
  const data = new Uint8Array(colors.length * 4);
  for (let i = 0;i < colors.length; i++)
    data.set(parseColorRgba(state.colorContext, colors[i]), i * 4);
  state.colors = { key, data };
  return data;
};

export { setupWebGpuColors, getWebGpuColors };
