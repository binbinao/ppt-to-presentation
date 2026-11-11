// src/color-correction-shader-utils.ts
var COLOR_SPACE_GLSL = `
vec3 srgbToLinear(vec3 color) {
	vec3 lower = color / 12.92;
	vec3 upper = pow((color + 0.055) / 1.055, vec3(2.4));
	return mix(lower, upper, step(vec3(0.04045), color));
}

vec3 linearToSrgb(vec3 color) {
	vec3 nonNegative = max(color, vec3(0.0));
	vec3 lower = nonNegative * 12.92;
	vec3 upper = 1.055 * pow(nonNegative, vec3(1.0 / 2.4)) - 0.055;
	return mix(lower, upper, step(vec3(0.0031308), nonNegative));
}
`;
var WHITE_BALANCE_GLSL = `
vec3 applyWhiteBalanceLinear(vec3 linear, float temperature, float tint) {
	vec3 temperatureOffset = vec3(0.3, 0.0, -0.3) * temperature;
	vec3 tintOffset = vec3(0.15, -0.3, 0.15) * tint;
	vec3 gains = exp2(temperatureOffset + tintOffset);
	float luminanceGain = dot(gains, vec3(0.2126, 0.7152, 0.0722));
	return linear * gains / luminanceGain;
}
`;
var SHADOWS_HIGHLIGHTS_GLSL = `
float getShadowsHighlightsStops(
	vec3 color,
	float shadows,
	float highlights
) {
	float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
	float shadowWeight = 1.0 - smoothstep(0.0, 0.6, luminance);
	float highlightWeight = smoothstep(0.4, 1.0, luminance);
	shadowWeight *= shadowWeight;
	highlightWeight *= highlightWeight;
	return shadows * shadowWeight + highlights * highlightWeight;
}
`;
var VIBRANCE_GLSL = `
vec3 applyVibrance(vec3 color, float amount) {
	float maximum = max(max(color.r, color.g), color.b);
	float minimum = min(min(color.r, color.g), color.b);
	float lightness = (maximum + minimum) * 0.5;
	float chroma = maximum - minimum;
	float saturationDenominator = 1.0 - abs(2.0 * lightness - 1.0);
	float saturation = saturationDenominator <= 0.0
		? 0.0
		: chroma / saturationDenominator;

	if (saturation <= 0.000001) {
		return color;
	}

	float targetSaturation = amount >= 0.0
		? saturation + amount * (1.0 - saturation)
		: saturation * (1.0 + amount);
	return clamp(
		vec3(lightness) +
			(color - vec3(lightness)) * (targetSaturation / saturation),
		0.0,
		1.0
	);
}
`;

// src/color-correction-webgpu-shader-utils.ts
var COLOR_SPACE_WGSL = `
fn srgbToLinear(color: vec3f) -> vec3f {
	let lower = color / 12.92;
	let upper = pow((color + 0.055) / 1.055, vec3f(2.4));
	return mix(lower, upper, step(vec3f(0.04045), color));
}

fn linearToSrgb(color: vec3f) -> vec3f {
	let nonNegative = max(color, vec3f(0.0));
	let lower = nonNegative * 12.92;
	let upper = 1.055 * pow(nonNegative, vec3f(1.0 / 2.4)) - 0.055;
	return mix(lower, upper, step(vec3f(0.0031308), nonNegative));
}
`;
var WHITE_BALANCE_WGSL = `
fn applyWhiteBalanceLinear(linear: vec3f, temperature: f32, tint: f32) -> vec3f {
	let temperatureOffset = vec3f(0.3, 0.0, -0.3) * temperature;
	let tintOffset = vec3f(0.15, -0.3, 0.15) * tint;
	let gains = exp2(temperatureOffset + tintOffset);
	let luminanceGain = dot(gains, vec3f(0.2126, 0.7152, 0.0722));
	return linear * gains / luminanceGain;
}
`;
var SHADOWS_HIGHLIGHTS_WGSL = `
fn getShadowsHighlightsStops(color: vec3f, shadows: f32, highlights: f32) -> f32 {
	let luminance = dot(color, vec3f(0.2126, 0.7152, 0.0722));
	let shadowWeight = 1.0 - smoothstep(0.0, 0.6, luminance);
	let highlightWeight = smoothstep(0.4, 1.0, luminance);
	return shadows * shadowWeight * shadowWeight + highlights * highlightWeight * highlightWeight;
}
`;
var VIBRANCE_WGSL = `
fn applyVibrance(color: vec3f, amount: f32) -> vec3f {
	let maximum = max(max(color.r, color.g), color.b);
	let minimum = min(min(color.r, color.g), color.b);
	let lightness = (maximum + minimum) * 0.5;
	let chroma = maximum - minimum;
	let saturationDenominator = 1.0 - abs(2.0 * lightness - 1.0);
	var saturation = 0.0;
	if (saturationDenominator > 0.0) {
		saturation = chroma / saturationDenominator;
	}
	if (saturation <= 0.000001) {
		return color;
	}
	var targetSaturation = saturation * (1.0 + amount);
	if (amount >= 0.0) {
		targetSaturation = saturation + amount * (1.0 - saturation);
	}
	return clamp(vec3f(lightness) + (color - vec3f(lightness)) * (targetSaturation / saturation), vec3f(0.0), vec3f(1.0));
}
`;

export { COLOR_SPACE_GLSL, WHITE_BALANCE_GLSL, SHADOWS_HIGHLIGHTS_GLSL, VIBRANCE_GLSL, COLOR_SPACE_WGSL, WHITE_BALANCE_WGSL, SHADOWS_HIGHLIGHTS_WGSL, VIBRANCE_WGSL };
