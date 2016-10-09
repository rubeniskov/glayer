attribute vec4 aPosition;
attribute vec2 aQuadPosition;
varying vec2 vCoord;
varying vec2 vQuadCoord;
void main() {
    gl_Position = vec4(aPosition.xy, 0.0, 1.0);
    vCoord = aPosition.zw;
    vQuadCoord = aQuadPosition.xy;
}
