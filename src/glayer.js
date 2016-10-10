import glsl from "glslify";
import glContext from "gl";
import glBatch from "gl-sprite-batch";
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

            console.log(gl.getExtension("EXT_texture_filter_anisotropic"), 'EXT_texture_filter_anisotropic');
            this.batch = glBatch(gl, {
                dynamic: true,
                capacity: 4
            });

            this.shader = glShader(gl, {
                texcoord: true,
                color: true,
                normal: false
            });

        }

        var time = 0;
        this.render = function() {
            time += 0.1;

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
            this.batch.premultiplied = true

            this.shader.bind();
            this.shader.uniforms.texture0 = 0;

            mat4.ortho(ortho, 0, this.width, this.height, 0, 0, 1);
            this.shader.uniforms.projection = ortho;

            this.batch.bind(this.shader);
            this.batch.clear();

            // this._channels.map(function(channel) {
            //     channel._samplers.map(function(sample) {
            //         console.log(sample);
            //         self.batch.push({
            //             texture: sample.texture,
            //             position: [0, 0],
            //             shape: sample.texture.shape
            //             // color:  [1.0, 0.0, 0.2, 0.2]
            //         });
            //     });
            // });

            var sample;

            sample = this._channels[0]._samplers[0];

            self.batch.push({
                texture: sample.texture,
                position: [0, 0],
                shape: sample.texture.shape
            });

            sample = this._channels[1]._samplers[0];

            var d = Math.cos(time * 0.01);
            var w = d * sample.texture.shape[0];
            var h = d * sample.texture.shape[1];

            self.batch.push({
                texture: sample.texture,
                position: [
                  (self.width - w) * 0.5 + Math.cos(time * 0.1) * (100 * d),
                  (self.height - h) * 0.5 + Math.sin(time * 0.1) * (100 * d)
                ],
                shape: [Math.cos(time * 0.01) * w, Math.cos(time * 0.01) * h],
                color: [0.8, 0.0, 0.0, 0.8]
            });

            // sample = this._channels[2]._samplers[0];
            //
            // d = Math.cos(time * 0.01);
            // w = d * sample.texture.shape[0];
            // h = d * sample.texture.shape[1];
            //
            // self.batch.push({
            //     texture: sample.texture,
            //     position: [
            //       (self.width - w) * 0.5 + Math.cos(time * 0.1) * (100 * d),
            //       (self.height - h) * 0.5 + Math.sin(time * 0.1) * (100 * d)
            //     ],
            //     shape: [Math.cos(time * 0.01) * w, Math.cos(time * 0.01) * h],
            //     color: [1/Math.cos(time * 0.1), 0.0, 0.0, Math.sin(time * 0.01)]
            // });

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
