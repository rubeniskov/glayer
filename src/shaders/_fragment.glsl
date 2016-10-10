#pragma glslify: yuv420p = require('./yuv420p.glsl')

precision highp float;

const int MAX_CHANNELS_COUNT = 4;
const int MAX_SAMPLERS_COUNT = 12;
const vec4 VEC4_ZERO = vec4(0.0, 0.0, 0.0, 0.0);

uniform int uChannels[MAX_CHANNELS_COUNT];
uniform sampler2D uSamplers[MAX_SAMPLERS_COUNT];
uniform int uChannel;

varying vec2 vCoord;
varying vec2 vQuadCoord;

int vChannelIndex;
int vSamplerIndex;

vec3 blendOverlay(vec3 base, vec3 blend) {
    return mix(1.0 - 2.0 * (1.0 - base) * (1.0 - blend), 2.0 * base * blend, step(base, vec3(0.5)));
}

vec4 getSampler(int index, vec2 coord) {
    for (int i=0; i< MAX_SAMPLERS_COUNT; i++) {
        if (i == index) return texture2D(uSamplers[i], coord);
    }
    return VEC4_ZERO;
}

int getChannel(int index) {
    for (int i=0; i< MAX_CHANNELS_COUNT; i++) {
        if (i == index) return uChannels[i];
    }
    return -1;
}

vec4 getChannelSampler(const int index, vec2 coord) {
    if(getChannel(index) == 1){ // RGB && // RGBA
        return getSampler(vSamplerIndex++, coord);
    } else if(getChannel(index) == 2) { // YUV
        return vec4(yuv420p(
            getSampler(vSamplerIndex++, coord).r,
            getSampler(vSamplerIndex++, vQuadCoord).r,
            getSampler(vSamplerIndex++, vQuadCoord).r
        ), 1.0);
    }
    return VEC4_ZERO;
}

void _main() {
    vec4 result = VEC4_ZERO;

    if (uChannel == -1) {
        for(int i=0;i < 2;i ++) {
            vec4 channel = getChannelSampler(i, vCoord);
            result = mix(result, channel, channel.a);
        }
    } else if(uChannel < 2) {
        result = getChannelSampler(uChannel, vCoord);
    }

    gl_FragColor = result;
}

void main() {
    gl_FragColor = getSampler(uChannel, vCoord);
}
