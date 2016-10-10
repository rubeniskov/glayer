import glTexture from "gl-texture2d";
import ndarray from "ndarray";

var samplerPtr = -1;
var channelPtr = -1;

export default class Channel {
    static defaults = {
        format: {
            "type": 'string',
            "default": 'rgba'
        },
        components: {
            "type": 'number'
        },
        bitdepth: {
            "type": 'number'
        },
        resolution: {
            "type": 'array'
        }
    }
    get format() {
        return this.options.format;
    }
    get size() {
        return (this.options.resolution[0] * this.options.resolution[1] * this.options.bitdepth) >>> 3;
    }
    get resolution() {
        return this.options.resolution;
    }
    get components() {
        return this.options.components;
    }
    get bitdepth() {
        return this.options.bitdepth;
    }
    get samplers() {
        return this._samplers;
    }
    constructor(context, options) {
        this.options = options;
        this.context = context;
        this._samplers = [];
    }
    bind() {
        var gl = this.context.contextGL;
        switch (this.format) {
            case 'rgb':
            case 'rgba':
                this.addSampler(this.resolution, gl[this.format.toUpperCase()], gl.UNSIGNED_BYTE);
                this.type = 1
                break;
            case 'yuv420p':
                var quad = [this.resolution[0] >>> 1, this.resolution[1] >>> 1];
                this.type = 2
                this.addSampler(this.resolution, gl.LUMINANCE, gl.UNSIGNED_BYTE);
                this.addSampler(quad, gl.LUMINANCE, gl.UNSIGNED_BYTE);
                this.addSampler(quad, gl.LUMINANCE, gl.UNSIGNED_BYTE);
                break;
        }

        // this.context.shader.uniforms.uChannels[(this.unit = ++channelPtr)] = this.type;

        return this;
    }
    set(data) {
        var self = this;
        if (!data || data.length !== this.size)
            return this;
        switch (this.format) {
            case 'rgb':
            case 'rgba':
                this.samplers.map(function(sampler, index) {
                    sampler.data(self.data(data));
                });
                break;
            case 'yuv420p':
                var quad = [this.resolution[0] >>> 2, this.resolution[1] >>> 2],
                    ylen = this.resolution[0] * this.resolution[1],
                    uvlen = quad[0] * quad[1],
                    props = [
                        [0, ylen, this.resolution],
                        [ylen, ylen + uvlen, quad],
                        [ylen + uvlen, ylen + uvlen << 1, quad]
                    ];
                // this.samplers.map(function(sampler, index) {
                //     sampler.data(self.data(data.subarray(props[index][0], props[index][1]), props[index][2], 1));
                // });
                break;
        }
        return this;
    }
    addSampler(resolution, format, type){
        var gl = this.context.contextGL,
            self = this;;
            // this.context.shader.bind();
        var pointer = 0,
            texture = new glTexture(gl, resolution, format, type),
            sampler = {
                pointer: pointer,
                texture: texture,
                bind: function(){
                },
                data: function(ndata){
                    texture.setPixels(ndata);
                }
            };
        this._samplers.push(sampler);
    }
    data(data, resolution, components) {
        components = components || this.components;
        resolution = resolution ||  this.resolution;
        return ndarray(new Uint8Array(data), resolution.concat([components]), [components, components * resolution[0], 1], 0);
    }
}
