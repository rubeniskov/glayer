import dxt from "dxt-js";

var self = {
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    yuv709(y, u, v) {
        return [
            self.clamp(y + 1.370705 * (v - 128), 0, 255),
            self.clamp(y - 0.698001 * (v - 128) - 0.337633 * (u - 128), 0, 255),
            self.clamp(y + 1.732446 * (u - 128), 0, 255)
        ]
    },
    yuv2rgb(buffer, height, width) {
        var ylen = width * height,
            uvlen = ylen >>> 2,
            data = new Uint8Array(ylen * 3);

        for (var i = 0; i < ylen; ++i) {
            var x = i % height
            var y = ~~(i / height);
            var yy = buffer[i];
            var uu = buffer[~~(i * 0.125) + ~~(i * 0.125) + ylen];
            var vv = buffer[~~(i * 0.125) + ~~(i * 0.125) + ylen + uvlen];
            var r = 1.164 * (yy - 16) + 1.596 * (vv - 128);
            var g = 1.164 * (yy - 16) - 0.813 * (vv - 128) - 0.391 * (uu - 128);
            var b = 1.164 * (yy - 16) + 2.018 * (uu - 128);

            data[i * 3] = self.clamp(r, 0, 255);
            data[i * 3 + 1] = self.clamp(g, 0, 255);
            data[i * 3 + 2] = self.clamp(b, 0, 255);
        }
        return data;
    },
    // yuv2rgb(buffer, height, width) {
    //     var ylen = width * height,
    //         uvlen = ylen >>> 2,
    //         data = new Uint8Array(ylen * 3),
    //         factor = 1;
    //
    //     for (var i = 0, j = 0, ph, pw, px, pp, ps; i < ylen; ++i) {
    //         ph = i % height;
    //         pw = ~~(i / height);
    //         px = ph * width + pw;
    //         pp = ~~(ph) * width;
    //         ps = ~~(ph * 0.25) * width;
    //
    //         var y = buffer[i],
    //             u = (buffer[~~(i * 0.25) + ylen] + buffer[~~(i * 0.25) + ylen + 1]) / 2,
    //             v = (buffer[~~(i * 0.25) + ylen + uvlen] + buffer[~~(i * 0.25) + ylen + 1 + uvlen]) / 2,
    //             rgb = self.yuv709(y, u, v);
    //
    //         data[j++] = rgb[0];
    //         data[j++] = rgb[1];
    //         data[j++] = rgb[2];
    //
    //         // data[j++] = buffer[pp];
    //         // data[j++] = buffer[pp];
    //         // data[j++] = buffer[pp];
    //
    //         // data[i] = (255 << 24) |
    //         //     (rgb[2] << 16) |
    //         //     (rgb[1] << 8) |
    //         //     (rgb[0])
    //         //
    //         // data[i] = (rgb[2] << 16) |
    //         //     (rgb[1] << 8) |
    //         //     (rgb[0])
    //     }
    //     return data;
    // },
    // yuv2rgb(yuvs, width, height) {
    //     //the end of the luminance data
    //     var lumEnd = width * height;
    //     var rgbs = new Uint8Array(lumEnd * 2);
    //     //points to the next luminance value pair
    //     var lumPtr = 0;
    //     //points to the next chromiance value pair
    //     var chrPtr = lumEnd;
    //     //points to the next byte output pair of RGB565 value
    //     var outPtr = 0;
    //     //the end of the current luminance scanline
    //     var lineEnd = width;
    //
    //     while (true) {
    //
    //         //skip back to the start of the chromiance values when necessary
    //         if (lumPtr == lineEnd) {
    //             if (lumPtr == lumEnd) break; //we've reached the end
    //             //division here is a bit expensive, but's only done once per scanline
    //             chrPtr = lumEnd + ((lumPtr >> 1) / width) * width;
    //             lineEnd += width;
    //         }
    //
    //         //read the luminance and chromiance values
    //         var Y1 = yuvs[lumPtr++] & 0xff;
    //         var Y2 = yuvs[lumPtr++] & 0xff;
    //         var Cr = (yuvs[chrPtr++] & 0xff) - 128;
    //         var Cb = (yuvs[chrPtr++] & 0xff) - 128;
    //         var R, G, B;
    //
    //         //generate first RGB components
    //         B = Y1 + ((454 * Cb) >> 8);
    //         if (B < 0) B = 0;
    //         else if (B > 255) B = 255;
    //         G = Y1 - ((88 * Cb + 183 * Cr) >> 8);
    //         if (G < 0) G = 0;
    //         else if (G > 255) G = 255;
    //         R = Y1 + ((359 * Cr) >> 8);
    //         if (R < 0) R = 0;
    //         else if (R > 255) R = 255;
    //         //NOTE: this assume little-endian encoding
    //         rgbs[outPtr++] = (((G & 0x3c) << 3) | (B >> 3));
    //         rgbs[outPtr++] = ((R & 0xf8) | (G >> 5));
    //
    //         //generate second RGB components
    //         B = Y2 + ((454 * Cb) >> 8);
    //         if (B < 0) B = 0;
    //         else if (B > 255) B = 255;
    //         G = Y2 - ((88 * Cb + 183 * Cr) >> 8);
    //         if (G < 0) G = 0;
    //         else if (G > 255) G = 255;
    //         R = Y2 + ((359 * Cr) >> 8);
    //         if (R < 0) R = 0;
    //         else if (R > 255) R = 255;
    //         //NOTE: this assume little-endian encoding
    //         rgbs[outPtr++] = (((G & 0x3c) << 3) | (B >> 3));
    //         rgbs[outPtr++] = ((R & 0xf8) | (G >> 5));
    //     }
    //
    //     return new Uint16Array(rgbs);
    // },
    yuv2dxt: function(buffer, height, width) {
        return dxt.compress(self.yuv2rgb(buffer, height, width), height, width, dxt.flags.DXT5);
    }
};


export default self
