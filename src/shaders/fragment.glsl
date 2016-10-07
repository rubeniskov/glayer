precision highp float;
uniform sampler2D sampler0;
uniform sampler2D sampler1;
varying vec2 v_coord0;
varying vec2 v_coord1;

vec3 blendOverlay(vec3 base, vec3 blend) {
    return mix(1.0 - 2.0 * (1.0 - base) * (1.0 - blend), 2.0 * base * blend, step(base, vec3(0.5)));
}

void main() {
    vec4 s0 = texture2D(sampler0, v_coord0);
    vec4 s1 = texture2D(sampler1, v_coord1);
    gl_FragColor = vec4(blendOverlay(s0.rgb, s1.rgb), 1.0);
}
