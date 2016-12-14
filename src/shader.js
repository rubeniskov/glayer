var identity = require('gl-mat4/identity')
var createShader = require('gl-shader-core')

var POSITION_ATTRIBUTE = 'position',
    NORMAL_ATTRIBUTE = 'normal',
    COLOR_ATTRIBUTE = 'color',
    TEXCOORD_ATTRIBUTE = 'texcoord',
    FORMAT_ATTRIBUTE = 'format';


module.exports = function(gl, options) {
    options = options || {}
    options.texcoord = typeof options.texcoord === 'number' ?
        options.texcoord : (options.texcoord || 0)

    var shaderSource = module.exports.generate(options),
        vert = shaderSource.vertex,
        frag = shaderSource.fragment,
        uniforms = shaderSource.uniforms,
        attribs = shaderSource.attributes

    var shader = createShader(gl, vert, frag, uniforms, attribs)
    shader.bind()
    var arr = identity(new Float32Array(16))
    shader.uniforms.projection = arr;
    shader.uniforms.model = arr;
    shader.uniforms.view = arr;
    shader.uniforms.tint = options.tint || [1, 1, 1, 1];
    shader.uniforms.texture0 = 0
    shader.uniforms.texture1 = 1
    shader.uniforms.texture2 = 2

    return shader
}

module.exports.generate = function(options) {
    options = options || {}
    options.texcoord = typeof options.texcoord === 'number' ?
        options.texcoord : (options.texcoord || 0)

    var pointSize = typeof options.pointSize === 'number' ? options.pointSize : 1;
    var vert = typeof options.vertex === 'string' ?
        options.vertex : createVertexShader(options.normal, options.color, options.texcoord, pointSize)
    var frag = typeof options.fragment === 'string' ?
        options.fragment : createFragmentShader(options.color, options.texcoord)

    var uniforms = [{
        type: 'mat4',
        name: 'projection'
    }, {
        type: 'mat4',
        name: 'view'
    }, {
        type: 'mat4',
        name: 'model'
    }, {
        type: 'vec4',
        name: 'tint'
    }, {
        type: 'int',
        name: 'format'
    }, {
        type: 'sampler2D',
        name: 'texture0'
    }, {
        type: 'sampler2D',
        name: 'texture1'
    }, {
        type: 'sampler2D',
        name: 'texture2'
    }]

    //Similar to old school pipeline, we will use fixed locations
    //http://www.opengl.org/sdk/docs/tutorials/ClockworkCoders/attributes.php
    var attribs = [{
        type: 'vec2',
        name: POSITION_ATTRIBUTE,
        location: 0
    }, {
        type: 'vec2',
        name: 'uv',
        location: 1
    }, {
        type: 'vec4',
        name: COLOR_ATTRIBUTE,
        location: 2
    }]

    return {
        vertex: vert,
        fragment: frag,
        uniforms: uniforms,
        attributes: attribs
    }
}


function createVertexShader(hasNormals, hasColors, numTexCoords, pointSize) {
    var shader = [
        'attribute vec4 position;',
        'attribute vec2 uv;',
        'attribute vec4 color;',
        'uniform mat4 projection;',
        'uniform mat4 view;',
        'uniform mat4 model;',
        'varying vec4 v_col;',
        'varying vec2 v_uv;',
        'void main() {',
        'gl_Position = projection * view * model * position;',
        'v_col = color;',
        'v_uv = uv;',
        'gl_PointSize = 1.00000;',
        '}'
    ].join('\n')

    return shader;
}

function createFragmentShader(hasColors, numTexCoords) {
    var shader = [
        '#ifdef GL_ES',
        'precision mediump float;',
        '#endif',
        'precision highp float;',
        'varying vec4 v_col;',
        'varying vec2 v_uv;',
        'uniform int format;',
        'uniform sampler2D texture0;',
        'uniform sampler2D texture1;',
        'uniform sampler2D texture2;',
        'vec3 yuv420p(float y, float u, float v) {',
        'float fYmul = y * 1.1643828125;',
        'return vec3(',
        'fYmul + 1.59602734375 * v - 0.87078515625,',
        'fYmul - 0.39176171875 * u - 0.81296875 * v + 0.52959375,',
        'fYmul + 2.017234375   * u - 1.081390625',
        ');',
        '}',
        'void main() {',
        'if(format == 2){',
        'gl_FragColor = vec4(yuv420p(texture2D(texture0,  v_uv).r, texture2D(texture1,  v_uv).r, texture2D(texture2,  v_uv).r), 1.0);',
        '} else {',
        'gl_FragColor = texture2D(texture0,  v_uv);',
        '}',
        '}'
    ].join('\n')

    return shader;
}
