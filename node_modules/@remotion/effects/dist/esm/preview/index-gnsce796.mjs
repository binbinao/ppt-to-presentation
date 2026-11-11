// src/uv-coordinate.ts
var publicUvToShaderUv = (uv) => {
  return [uv[0], 1 - uv[1]];
};

export { publicUvToShaderUv };
