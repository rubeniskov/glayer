attribute vec4 aVertex;
attribute vec4 aPosition;
attribute vec4 aQuadPosition;

varying vec2 vCoord;
varying vec2 vQuadCoord;
void main() {
    gl_Position = vec4(aVertex.xy, 0.0, 1.0);;
    vCoord = aPosition.xy;
    vQuadCoord = aVertex.zw;
}
