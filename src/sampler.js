import glTexture from "gl-texture2d";
import pool from "typedarray-pool";
import ndarray from "ndarray";

export default class Sample {
    constructor(context, shape, dtype) {
        this._texture = glTexture(context, ndarray(pool.malloc(shape[0] * shape[1] * [2], dtype || 'uint8'), shape));
    }
    set(data) {
        this._texture.setPixels(data);
        return this;
    }
    dispose() {
        this._texture.dispose();
    }
}
