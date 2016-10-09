import glsl from "glslify";
import glContext from "gl";
import glShader from "gl-shader";
import glBuffer from "gl-buffer";
import glFBO from "gl-fbo";
import glVAO from "gl-vao";
import Channel from "./channel"

export default class Glayer {
    get channels() {
        return this._channels;
    }
    constructor(parOptions) {
        parOptions = parOptions || {};
        this._channels = [];
        this.contextOptions = parOptions.contextOptions;
        this.width = parOptions.width || this.canvasElement.width;
        this.height = parOptions.height || this.canvasElement.height;

        this._attachments = [];

        parOptions.canvas !== false && this.attach(parOptions.canvas || document.createElement("canvas"));

        this.initContextGL();
        if (this.contextGL) {
            this.initProgram();
            this.initBuffers();
            this.initChannels();
        };
    }
    attach(canvas) {
        this._attachments.push(canvas);
    }
    replace(canvas) {
        canvas.replaceChild(canvas, canvas);
    }
    draw() {
        var gl = this.contextGL;
        if (!gl) return;

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, this.width, this.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        this.vertices.bind();
        this.shader.attributes.aPosition.pointer();

        this.vertices.draw(gl.TRIANGLE_STRIP, 4);

        this._attachments.map(function(canvas) {
            canvas.width = gl.drawingBufferWidth;
            canvas.height = gl.drawingBufferHeight;

            function method1() {
                // When gl.canvas is defined using direct draw;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(gl.canvas, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            }

            function method2() {
                // When gl.readPixels is defined using clone pixels but need flip YX;
                var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
                gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                var ctx = canvas.getContext('2d');
                var imageData = ctx.getImageData(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                imageData.data.set(pixels);
                ctx.putImageData(imageData, 0, 0, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            }

            function method3() {
                // glContext remove canvas;
                var ctx = canvas.getContext('webgl');
                var fbo = glFBO(ctx, [gl.drawingBufferWidth, gl.drawingBufferHeight]);


                ctx.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
                    // all black
                ctx.clearColor(0, 0, 0, 1);
                ctx.clear(ctx.COLOR_BUFFER_BIT);

                // MUST BE BEFORE drawArrays fbo.bind();

                gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.handle);
                gl.readPixels(0, yOffset, width, chunkSize, format, gl.UNSIGNED_BYTE, chunkData)
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);

                // ctx.drawImage(gl.canvas, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            }

            method1();
        });

        this.vertices.unbind();
    }
    initContextGL() {
        var gl = glContext(this.width, this.height);
        var ext = gl.getExtension("WEBGL_draw_buffers");
        if (!ext) {
            console.log("No WEBGL_draw_buffers support -- this is legal");
            $(".tip p.extension").hide();
        } else {
            console.log("Successfully enabled WEBGL_draw_buffers extension");
            $(".tip p.noextension").hide();
        }

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
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
        this.shader.uniforms.uSamplers = [];
        this.shader.uniforms.uChannels = [];
        this.shader.uniforms.uChannel = -1;
        this.shader.attributes.aPosition.location = 0;
        this.shader.attributes.aQuadPosition.location = 1;
    }
    initChannels() {
        var self = this;
        this._channels.map(function(channel, index) {
            self.bindChannel(channel, index);
        });
    }
    initBuffers() {
        var gl = this.contextGL;


        this.vertices = glVAO(gl, [{
            "buffer": glBuffer(gl, [.5, -1.0, 0.0, 1.0, +1.0, -1.0, 1.0, 1.0, -1.0, +1.0, 0.0, 0.0,
                1.0, +1.0, 1.0, 0.0
            ]),
            "type": gl.FLOAT,
            "size": 4
        }]);
        this.vertices.bind();
        this.shader.attributes.aPosition.pointer();

        // this.quadVertices.bind();
        // this.shader.attributes.aQuadPosition.pointer();
        // 2, gl.FLOAT, false, 0, 0
        // type, normalized, stride, offset

          // GLuint index,
          // GLint size,
          // GLenum type,
          // GLboolean normalized,
          // GLsizei stride,
          // const GLvoid * pointer);

        // var tTop = 0;
        // var tLeft = 0;
        // var tBottom = 1.5;
        // var tRight = 1.5;

        this.quadVertices = glVAO(gl, [{
            "buffer": glBuffer(gl, [-1.0, -1.0, 0.0, 1.0, +1.0, -1.0, 1.0, 1.0, -1.0, +1.0, 0.0, 0.0,
                1.0, +1.0, 1.0, 0.0
            ]),
            "type": gl.FLOAT,
            "size": 4
        }]);

        this.quadVertices.bind();
        this.shader.attributes.aQuadPosition.pointer();

        gl.enable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
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
