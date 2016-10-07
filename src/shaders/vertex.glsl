attribute vec4 vert;
varying vec2 v_coord0;
varying vec2 v_coord1;

void main() {
    gl_Position = vec4(vert.xy, 0.0, 1.0);
    v_coord0 = vert.zw;
    v_coord1 = vert.zw;
}
