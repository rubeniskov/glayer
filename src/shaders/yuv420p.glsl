//
// Description : YUV 420 Planar conversion.
//      Author : Rubeniskov
//  Maintainer : Rubeniskov
//     Lastmod : 20161009 (rubeniskov)
//     License : Copyright (C) 2016 Rubeniskov. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/rubeniskov
//

precision highp float;

vec3 yuv420p(float y, float u, float v) {

    float fYmul = y * 1.1643828125;

    return vec3(
        fYmul + 1.59602734375 * v - 0.87078515625,
        fYmul - 0.39176171875 * u - 0.81296875 * v + 0.52959375,
        fYmul + 2.017234375   * u - 1.081390625
    );
}

#pragma glslify: export(yuv420p)
