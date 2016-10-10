#ifdef GL_ES
precision mediump float;
#endif

varying vec4 v_col;
varying vec2 v_tex0;

uniform sampler2D texture0;
uniform vec4 tint;

void main() {
    gl_FragColor = v_col * texture2D(texture0, v_tex0) * tint;
}
