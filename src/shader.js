var identity = require('gl-mat4/identity')
var createShader = require('gl-shader-core')

var POSITION_ATTRIBUTE = 'position',
    NORMAL_ATTRIBUTE = 'normal',
    COLOR_ATTRIBUTE = 'color',
    TEXCOORD_ATTRIBUTE = 'texcoord';


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
    for (var i = 0; i < options.texcoord; i++)
        shader.uniforms['texture' + i] = i

    var arr = identity(new Float32Array(16))
    shader.uniforms.projection = arr
    shader.uniforms.model = arr
    shader.uniforms.view = arr
    shader.uniforms.tint = options.tint || [1, 1, 1, 1]

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
    }]

    //Similar to old school pipeline, we will use fixed locations
    //http://www.opengl.org/sdk/docs/tutorials/ClockworkCoders/attributes.php
    var attribs = [{
        type: 'vec4',
        name: POSITION_ATTRIBUTE,
        location: 0
    }]

    if (options.normal)
        attribs.push({
            type: 'vec3',
            name: NORMAL_ATTRIBUTE,
            location: 1
        })
    if (options.color)
        attribs.push({
            type: 'vec4',
            name: COLOR_ATTRIBUTE,
            location: 2
        })

    attribs.push({
        type: 'int',
        name: 'type',
        location: 3
    });

    var idx = 4
    for (var i = 0; i < options.texcoord; i++) {
        uniforms.push({
            type: 'sampler2D',
            name: 'texture' + i
        })
        attribs.push({
            type: 'vec2',
            name: TEXCOORD_ATTRIBUTE + i,
            location: idx++
        })
    }

    return {
        vertex: vert,
        fragment: frag,
        uniforms: uniforms,
        attributes: attribs
    }
}


function createVertexShader(hasNormals, hasColors, numTexCoords, pointSize) {
    numTexCoords = numTexCoords || 0;
    var shader = "";
    shader += "attribute vec4 " + POSITION_ATTRIBUTE + ";\n" +
        (hasNormals ? "attribute vec3 " + NORMAL_ATTRIBUTE + ";\n" : "") +
        (hasColors ? "attribute vec4 " + COLOR_ATTRIBUTE + ";\n" : "") +
         "attribute float type;\n";

    var i;
    pointSize = pointSize.toFixed(5);

    for (i = 0; i < numTexCoords; i++) {
        shader += "attribute vec2 " + TEXCOORD_ATTRIBUTE + i + ";\n";
    }

    shader += "uniform mat4 projection;\n";
    shader += "uniform mat4 view;\n";
    shader += "uniform mat4 model;\n";

    shader += (hasColors ? "varying vec4 v_col;\n" : "");
    shader += "varying float v_type;\n";
    for (i = 0; i < numTexCoords; i++) {
        shader += "varying vec2 v_tex" + i + ";\n";
    }

    shader += "\nvoid main() {\n" + "   gl_Position = projection * view * model * " + POSITION_ATTRIBUTE + ";\n" +
        (hasColors ? "   v_col = " + COLOR_ATTRIBUTE + ";\n" : "") +
        "    v_type = type;\n";

    for (i = 0; i < numTexCoords; i++) {
        shader += "   v_tex" + i + " = " + TEXCOORD_ATTRIBUTE + i + ";\n";
    }
    shader += "   gl_PointSize = " + pointSize + ";\n";
    shader += "}\n";
    return shader;
}

function createFragmentShader(hasColors, numTexCoords) {
    numTexCoords = numTexCoords || 0;
    var shader = "#ifdef GL_ES\n" + "precision mediump float;\n" + "#endif\n\n";

    if (hasColors)
        shader += "varying vec4 v_col;\n";

    var i;
    for (i = 0; i < numTexCoords; i++) {
        shader += "varying vec2 v_tex" + i + ";\n";
        shader += "uniform sampler2D texture" + i + ";\n";
    }
    shader += "varying float v_type;\n";
    shader += "uniform vec4 tint;\n";

    shader += [
        'precision highp float;',
        'vec3 yuv420p(float y, float u, float v) {',
        'float fYmul = y * 1.1643828125;',
        'return vec3(',
        'fYmul + 1.59602734375 * v - 0.87078515625,',
        'fYmul - 0.39176171875 * u - 0.81296875 * v + 0.52959375,',
        'fYmul + 2.017234375   * u - 1.081390625',
        ');',
        '}',
        'void main() {',
        'if(v_col.a == 0.0){',
        'gl_FragColor = vec4(yuv420p(texture2D(texture0,  v_tex0).r, texture2D(texture1,  v_tex0).r, texture2D(texture2,  v_tex0).r), 1.0) * tint;',
        '} else {',
        'gl_FragColor = texture2D(texture0,  v_tex0) * tint;',
        '}',
        '}'
    ].join('\n');
    return shader;
}
