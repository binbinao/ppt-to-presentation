import {
  buildGaussianBlurFs
} from "./index-evy8hyah.mjs";

// src/blur/blur-shaders.ts
var BLUR_VS = `#version 300 es
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec2 aUv;
out vec2 vUv;
void main() {
	vUv = aUv;
	gl_Position = vec4(aPos, 0.0, 1.0);
}
`;
var BLUR_FS_HORIZONTAL = buildGaussianBlurFs("horizontal");
var BLUR_FS_VERTICAL = buildGaussianBlurFs("vertical");

export { BLUR_VS, BLUR_FS_HORIZONTAL, BLUR_FS_VERTICAL };
