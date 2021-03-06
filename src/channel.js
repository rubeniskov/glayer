import glTexture from "gl-texture2d";
import ndarray from "ndarray";
import Sampler from "./sampler"

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
    get color() {
        return this.options.color || [0, 0, 0, 0];
    }
    get shape() {
        return this.options.resolution;
    }
    set resolution(value) {
        this.options.resolution = value;
    }
    get position() {
        return this.options.position;
    }
    set position(value) {
        this.options.position = value;
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
        this.options.position = [0, 0];
        this.context = context;
        this._samplers = [];
    }
    bind() {
        var gl = this.context.contextGL;
        switch (this.format) {
            case 'rgb':
                this.addSampler([1, 1, 3]);
                break;
            case 'rgba':
                this.addSampler([1, 1, 4]);
                // this.addSampler(this.resolution, gl[this.format.toUpperCase()], gl.UNSIGNED_BYTE);
                this.type = 1
                break;
            case 'yuv420p':
                this.addSampler([1, 1]);
                this.addSampler([1, 1]);
                this.addSampler([1, 1]);
                this.type = 2
                    // var quad = [this.resolution[0] >>> 1, this.resolution[1] >>> 1];
                    // this.type = 2
                    // this.addSampler(this.resolution, gl.LUMINANCE, gl.UNSIGNED_BYTE);
                    // this.addSampler(quad, gl.LUMINANCE, gl.UNSIGNED_BYTE);
                    // this.addSampler(quad, gl.LUMINANCE, gl.UNSIGNED_BYTE);
                break;
        }

        // this.context.shader.uniforms.uChannels[(this.unit = ++channelPtr)] = this.type;

        return this;
    }
    set(data, shape) {
        this.disabled = data === undefined;
        if (this.disabled)
            return this.disabled;

        var self = this;
        switch (this.format) {
            case 'rgb':
                break;
            case 'rgba':
                this._samplers[0].set(data, shape ? [shape[0], shape[1], 4] : undefined);
                // // this.samplers.map(function(sampler, index) {
                // //     this.samplers[0].data(self.data(data));
                // // });
                // this.samplers[0].data(self._data(data));
                break;
            case 'yuv420p':
                shape = Object.assign(this.resolution, shape);
                var quad = [shape[0] >>> 1, shape[1] >>> 1],
                    ylen = shape[0] * shape[1],
                    uvlen = quad[0] * quad[1];
                this.samplers[0].set(data.subarray(0, ylen), shape);
                this.samplers[1].set(data.subarray(ylen, ylen + uvlen), quad);
                this.samplers[2].set(data.subarray(ylen + uvlen, ylen + uvlen << 1), quad);

                // var quad = [this.resolution[0] >>> 1, this.resolution[1] >>> 1],
                //     ylen = this.resolution[0] * this.resolution[1],
                //     uvlen = quad[0] * quad[1],
                //     props = [
                //         [0, ylen, this.resolution],
                //         [ylen, ylen + uvlen, quad],
                //         [ylen + uvlen, ylen + uvlen << 1, quad]
                //     ];
                //
                // this.samplers.map(function(samplers, idx){
                //     samplers.data(self._data(data.subarray(props[idx][0], props[idx][1]), props[idx][2], 1));
                // })
                break;
        }
        return this;
    }
    addSampler(shape, ntype) {
        var gl = this.context.contextGL;
        this._samplers.push(new Sampler(gl, shape, ntype));
    }
}
