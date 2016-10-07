import glsl from "glslify";
import glShader from "gl-shader";
import glTexture from "gl-texture2d";
import glContext from "webgl-context";
import ndarray from "ndarray";
import Channel from "./channel"

export default class Canvas {
    get channels() {
        return this._channels;
    }
    constructor(parOptions) {
        parOptions = parOptions || {};
        this._channels = [];
        this.contextOptions = parOptions.contextOptions;
        this.width = parOptions.width || this.canvasElement.width;
        this.height = parOptions.height || this.canvasElement.height;
        parOptions.canvas !== false && this.attach(parOptions.canvas || document.createElement("canvas"));
    }
    attach(canvas) {
        this.canvasElement = canvas;
        this.canvasElement.width = this.width;
        this.canvasElement.height = this.height;
        this.initContextGL();
        if (this.contextGL) {
            this.initProgram();
            this.initBuffers();
            this.initChannels();
        };
    }
    draw() {
        var gl = this.contextGL;
        if (!gl) return;
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer_);
        this.shader.attributes.vert.pointer()
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    initContextGL() {
        var canvas = this.canvasElement;
        var gl = null;

        var validContextNames = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
        var nameIndex = 0;

        while (!gl && nameIndex < validContextNames.length) {
            var contextName = validContextNames[nameIndex];

            try {
                if (this.contextOptions) {
                    gl = canvas.getContext(contextName, this.contextOptions);
                } else {
                    gl = canvas.getContext(contextName);
                };
            } catch (e) {
                gl = null;
            }

            if (!gl || typeof gl.getParameter !== "function") {
                gl = null;
            }

            ++nameIndex;
        };

        this.quadVertexBuffer_ = gl.createBuffer();

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);


        this.compress = (
            gl.getExtension("WEBGL_compressed_texture_s3tc") ||
            gl.getExtension("MOZ_WEBGL_compressed_texture_s3tc") ||
            gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc")
        )

        this.contextGL = gl;
    }
    initProgram() {
        var gl = this.contextGL;

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        this.shader = glShader(gl, glsl('./shaders/vertex.glsl'), glsl('./shaders/fragment.glsl'));
        this.shader.bind();
        this.shaderProgram = this.shader.program;
    }
    initChannels() {
        var self = this;
        this._channels.map(function(channel) {
            self.bindChannel(channel);
        });
    }
    initBuffers() {
        var gl = this.contextGL;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer_);
        var vertices = new Float32Array([-1.0, -1.0, 0.0, 1.0, +1.0, -1.0, 1.0, 1.0, -1.0, +1.0, 0.0, 0.0,
            1.0, +1.0, 1.0, 0.0
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);


        gl.enableVertexAttribArray(0);

        // gl.glEnable(GL_BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
    }
    addChannel(options) {
        var gl = this.contextGL;
        var channel = new Channel(options);
        this._channels.push(channel);
        gl && this.bindChannel(channel);
        return this;
    }
    bindChannel(channel) {
        var self = this,
            gl = this.contextGL;

        switch (channel.format) {
            case 'rgb':
            case 'rgba':
                var index = this._channels.length - 1;
                channel.index = index;
                channel.sampler = 'sampler' + index;
                channel.data = function(data) {
                    channel._data = ndarray(new Uint8Array(data), [this.resolution[0], this.resolution[1], this.components], [this.components, this.components * this.resolution[0], 1], 0);
                    return channel._data;
                }
                channel.set = function(data) {
                    if (data && data.length === this.size) {
                        self.shader.bind();
                        self.shader.uniforms[this.sampler] = this._textures[0].bind(this.index);
                        this._textures[0].setPixels(this.data(data));
                    }
                    return channel;
                }
                channel._textures = [new glTexture(gl, channel.resolution, gl[channel.format.toUpperCase()], gl.UNSIGNED_BYTE)];
                self.shader.uniforms[channel.sampler] = channel._textures[0].bind(index);
                break;
            case 'yuv420p':
                channel._textures = [
                    new glTexture(gl, ndarray(new Uint8Array(channel.size), channel.resolution)),
                    new glTexture(gl, ndarray(new Uint8Array(channel.size >>> 2), channel.resolution)),
                    new glTexture(gl, ndarray(new Uint8Array(channel.size >>> 2), channel.resolution))
                ];
                break;
        }
    }
}
