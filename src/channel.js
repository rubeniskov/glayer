import ajv from 'ajv';

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
    get format(){
        return this.options.format;
    }
    get size(){
        return this.options.resolution[0] * this.options.resolution[1] * this.options.components;
    }
    get resolution(){
        return this.options.resolution;
    }
    get components(){
        return this.options.components;
    }
    get bitdepth(){
        return this.options.bitdepth;
    }
    constructor(options) {
        var validate = ajv().compile(Channel.defaults),
            valid = validate(options);

        if (!valid)
            return console.log(validate.errors);

        this.options = options;

        // switch (this.options.format) {
        //     case 'rgba':
        //           this.options.components = 4;
        //           this.options.bitdepth = 32;
        //         break;
        // }
        // {
        //     format: 'y420p', // format
        //     components: 3, // bits per pixel
        //     bitdepth: 12, // bits per pixel
        //     data: new Uint8Array(), // data
        //     size: 0, // size in bytes
        //     resolution: [0, 0] // image resolution width - height
        // }
        options
    }
    set(data){
    }
}
