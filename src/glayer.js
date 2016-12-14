import glsl from "glslify";
import glContext from "gl";
import glBatch from "./batch";
import glBuffer from "gl-buffer";
import glFBO from "gl-fbo";
import glVAO from "gl-vao";
import glTexture from "gl-texture2d";
import mat4 from "gl-mat4";
import Channel from "./channel"

import glShader from "./shader";

export default class Glayer {
    get channels() {
        return this._channels;
    }
    constructor(options) {

        options = options || {};

        var ortho = mat4.create();
        var self = this;

        this.contextOptions = options.contextOptions;
        this.width = options.width || this.canvasElement.width;
        this.height = options.height || this.canvasElement.height;


        this._channels = [];
        this._attachments = [];

        var gl = this.contextGL = glContext(this.width, this.height, {
            antialias: true
        });

        options.canvas !== false && this.attach(options.canvas || document.createElement("canvas"));

        this.init = function() {

            // console.log(gl.getExtension("EXT_texture_filter_anisotropic"), 'EXT_texture_filter_anisotropic');
            this.batch = glBatch(gl, {
                dynamic: true,
                capacity: 4
            });

            this.shader = glShader(gl, {
                texcoord: 0,
                color: true,
                normal: false
            });

        }

        var time = 0;

        this.render = function() {
            time += 0.05;

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            this.batch.premultiplied = true

            this.shader.bind();

            mat4.ortho(ortho, 0, this.width, this.height, 0, 0, 1);
            this.shader.uniforms.projection = ortho;

            this.batch.bind(this.shader);
            this.batch.clear();

            var sprites = this._channels
            .filter(function(channel) {
                return !channel.disabled;
            })
            .map(function(channel, index) {
                return {
                    format: channel.type,
                    texture: channel._samplers.map(function(sampler) {
                        return sampler.texture
                    }),
                    position: channel.position,
                    shape: channel.shape,
                    color: channel.color
                }
            });

            self.batch.push(sprites);

            this.batch.draw();

            this._attachments.map(function(canvas) {
                canvas.width = gl.drawingBufferWidth;
                canvas.height = gl.drawingBufferHeight;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(gl.canvas, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            });

            this.batch.unbind();
        }

        this.draw = this.render;

        this.init();
    }
    attach(canvas) {
        this._attachments.push(canvas);
    }
    replace(canvas) {
        canvas.replaceChild(canvas, canvas);
    }
    initChannels() {
        var self = this;
        this._channels.map(function(channel, index) {
            self.bindChannel(channel, index);
        });
    }
    addChannel(options) {
        var gl = this.contextGL;
        var channel = new Channel(this, options);
        this._channels.push(channel);
        gl && this.bindChannel(channel, this._channels.length - 1);
        return channel;
    }
    bindChannel(channel, index) {
        channel.bind(index);
    }
}
