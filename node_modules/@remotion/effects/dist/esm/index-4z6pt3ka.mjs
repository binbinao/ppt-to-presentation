// src/value-noise-shader.ts
var VALUE_NOISE_SHADER = `
float lattice(ivec3 point, uint seed) {
  // Wrap lattice indices as well as coordinates so interpolation stays continuous
  // across the period boundary, including negative coordinates.
  uvec3 p = uvec3(point) & uvec3(65535u);
  uint h = p.x * 0x27d4eb2du ^ p.y * 0x165667b1u ^ p.z * 0x9e3779b9u ^ seed * 0x85ebca6bu;
  h ^= h >> 15;
  h *= 0x2c1b3c6du;
  h ^= h >> 12;
  h *= 0x297a2d39u;
  h ^= h >> 15;
  return float(h & 65535u) / 65535.0;
}

float catmull(vec4 p, float t) {
  return 0.5 * (2.0 * p.y + (p.z - p.x) * t
    + (2.0 * p.x - 5.0 * p.y + 4.0 * p.z - p.w) * t * t
    + (3.0 * p.y - p.x - 3.0 * p.z + p.w) * t * t * t);
}

vec3 bspline(float t) {
  return vec3(0.5 * (1.0-t) * (1.0-t), 0.5 + t * (1.0-t), 0.5 * t * t);
}

float sliceNoise(ivec3 p, vec2 t, uint seed) {
  if (uNoiseType == 0) return lattice(p, seed);
  if (uNoiseType == 1) {
    return mix(mix(lattice(p, seed), lattice(p + ivec3(1,0,0), seed), t.x),
      mix(lattice(p + ivec3(0,1,0), seed), lattice(p + ivec3(1,1,0), seed), t.x), t.y);
  }
  if (uNoiseType == 2) {
    vec3 wx = bspline(t.x);
    vec3 wy = bspline(t.y);
    float result = 0.0;
    for (int y = 0; y < 3; y++) {
      for (int x = 0; x < 3; x++) {
        result += wx[x] * wy[y] * lattice(p + ivec3(x-1, y-1, 0), seed);
      }
    }
    return result;
  }
  vec4 rows;
  for (int y = 0; y < 4; y++) {
    vec4 row;
    for (int x = 0; x < 4; x++) {
      row[x] = lattice(p + ivec3(x-1, y-1, 0), seed);
    }
    rows[y] = catmull(row, t.x);
  }
  return catmull(rows, t.y);
}

float valueNoise(vec3 point, uint seed) {
  // A large period keeps conversion to integer coordinates defined at extreme scales.
  vec3 p = mod(point + vec3(uNoiseType == 2 ? 0.5 : 0.0, uNoiseType == 2 ? 0.5 : 0.0, 0.0), 65536.0);
  ivec3 cell = ivec3(floor(p));
  vec3 t = fract(p);
  float fz = t.z * t.z * t.z * (t.z * (t.z * 6.0 - 15.0) + 10.0);
  float n = mix(sliceNoise(cell, t.xy, seed), sliceNoise(cell + ivec3(0,0,1), t.xy, seed), fz);
  return uNoiseType == 2 ? 0.5 + (n - 0.5) * (181.0 / 231.0) / 0.55 : n;
}
`;

// src/value-noise-webgpu-shader.ts
var VALUE_NOISE_WEBGPU_SHADER = `
fn lattice(point: vec3i, seed: u32) -> f32 {
  let p = bitcast<vec3u>(point) & vec3u(65535u);
  var h = (p.x*0x27d4eb2du) ^ (p.y*0x165667b1u) ^ (p.z*0x9e3779b9u) ^ (seed*0x85ebca6bu);
  h ^= h >> 15u; h *= 0x2c1b3c6du; h ^= h >> 12u; h *= 0x297a2d39u; h ^= h >> 15u;
  return f32(h & 65535u)/65535.0;
}
fn catmull(p: vec4f, t: f32) -> f32 {
  return 0.5*(2.0*p.y+(p.z-p.x)*t+(2.0*p.x-5.0*p.y+4.0*p.z-p.w)*t*t+(3.0*p.y-p.x-3.0*p.z+p.w)*t*t*t);
}
fn bspline(t: f32) -> vec3f { return vec3f(0.5*(1.0-t)*(1.0-t),0.5+t*(1.0-t),0.5*t*t); }
fn sliceNoise(p: vec3i,t: vec2f,seed: u32) -> f32 {
  if(noiseType()==0) { return lattice(p,seed); }
  if(noiseType()==1) { return mix(mix(lattice(p,seed),lattice(p+vec3i(1,0,0),seed),t.x),mix(lattice(p+vec3i(0,1,0),seed),lattice(p+vec3i(1,1,0),seed),t.x),t.y); }
  if(noiseType()==2) {
    let wx=bspline(t.x); let wy=bspline(t.y); var result=0.0;
    for(var y=0;y<3;y++) { for(var x=0;x<3;x++) { result += wx[x]*wy[y]*lattice(p+vec3i(x-1,y-1,0),seed); } }
    return result;
  }
  var rows: vec4f;
  for(var y=0;y<4;y++) {
    var row: vec4f;
    for(var x=0;x<4;x++) { row[x]=lattice(p+vec3i(x-1,y-1,0),seed); }
    rows[y]=catmull(row,t.x);
  }
  return catmull(rows,t.y);
}
fn valueNoise(point: vec3f,seed: u32) -> f32 {
  let offset=select(0.0,0.5,noiseType()==2);
  let shifted=point+vec3f(offset,offset,0.0);
  let p=shifted-floor(shifted/65536.0)*65536.0;
  let cell=vec3i(floor(p)); let t=fract(p);
  let fz=t.z*t.z*t.z*(t.z*(t.z*6.0-15.0)+10.0);
  let n=mix(sliceNoise(cell,t.xy,seed),sliceNoise(cell+vec3i(0,0,1),t.xy,seed),fz);
  return select(n,0.5+(n-0.5)*(181.0/231.0)/0.55,noiseType()==2);
}
`;

export { VALUE_NOISE_SHADER, VALUE_NOISE_WEBGPU_SHADER };
