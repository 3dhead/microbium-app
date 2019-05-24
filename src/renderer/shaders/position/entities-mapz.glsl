float mapZ (vec2 pos, float id) {
  float offset = length(pos);
  float t = smoothstep(0.0, 1.0, offset / 1400.0);
  float t0 = t * t;
  float offset3 = sin(t * 4.0) * 300.0;
  return -(offset * t0 * 0.4) + (offset3) + -(id * 8.0);
}

#pragma glslify: export(mapZ)
