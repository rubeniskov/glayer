import glTexture from 'gl-texture2d';
import pool from 'typedarray-pool';
import isTypeArray from 'is-typedarray';
import ndarray from 'ndarray';

export default class Sample {
    static ndata(dtype, shape){
        return ndarray(isTypeArray(dtype) ? dtype : pool.malloc(shape[0] * shape[1] * (shape[2] || 1), dtype ||  'uint8'), shape, shape[2] ? [shape[2], shape[2] * shape[0], 1] : [1, shape[0]], 0)
    }
    constructor(context, shape, dtype) {
        this._shape = shape;
        this._dtype = dtype;
        this._texture = glTexture(context, Sample.ndata(dtype, shape));
    }
    set(data, shape) {
        if (isTypeArray(data)) {
            if (!Array.isArray(shape))
                throw new TypeError('shape is not array');
            else
                data = Sample.ndata(data, shape);
        }

        if (data && data.data && data.stride && data.shape) {
            if (data.shape[0] + data.shape[1] !== this._texture.shape[0] + this._texture.shape[1])
                this._texture.shape = [data.shape[0], data.shape[1]];
            this._texture.setPixels(data);
        } else {
            throw new TypeError('data must be ndarray or type array');
        }

        return this;
    }
    dispose() {
        this._texture.dispose();
    }
}
