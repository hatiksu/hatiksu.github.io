// Шейдер фона: «туманность» из фрактального шума с искажением, подсвечивается у курсора.
export const VERTEX = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`

export const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uTilt;
uniform float uLight;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform vec3 uBg;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  p += uTilt * 0.15;
  float t = uTime * 0.045;
  vec2 m = (uMouse - 0.5) * vec2(uRes.x / min(uRes.x, uRes.y), uRes.y / min(uRes.x, uRes.y));
  float md = length(p - m);

  vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t + 3.1));
  vec2 r = vec2(fbm(p * 1.8 + 2.0 * q + vec2(1.7, 9.2) + t * 1.3), fbm(p * 1.8 + 2.0 * q + vec2(8.3, 2.8) - t));
  // Курсор плавно «раздвигает» туманность (без особой точки в центре)
  r += 0.6 * exp(-md * md * 6.0) * (p - m);
  float f = fbm(p * 1.6 + 2.6 * r);

  vec3 col = mix(uA, uB, clamp(q.x * 1.3, 0.0, 1.0));
  col = mix(col, uC, clamp(r.y * r.y * 1.4, 0.0, 1.0));
  float glow = smoothstep(0.25, 0.95, f) * (0.55 + 0.45 * exp(-md * 2.2));
  // Сверху ярче, к низу экрана — затухание, чтобы не мешать тексту
  float fade = mix(0.35, 1.0, smoothstep(0.0, 1.0, uv.y));
  float strength = mix(0.7, 0.35, uLight);
  vec3 outc = mix(uBg, col, glow * strength * fade);
  // Лёгкое зерно против полос на градиенте
  outc += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.012;
  gl_FragColor = vec4(outc, 1.0);
}
`

/** #rrggbb → [r, g, b] от 0 до 1 */
export function hexToRgb(hex: string): [number, number, number] {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i)
  if (!m) return [0, 0, 0]
  const n = parseInt(m[1], 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}
