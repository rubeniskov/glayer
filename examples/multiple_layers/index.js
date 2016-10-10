var Glayer = require('../..'),
    http = require('http'),
    loop = require('raf-loop'),
    Chunker = require('stream-chunker'),
    getPixels = require('get-pixels'),
    width = 640,
    height = 360,
    glayer = new Glayer({
        canvas: document.getElementById('canvas'),
        width: width,
        height: height
    }),
    channels = [
        /*{
                format: 'yuv420p',
                components: 3,
                bitdepth: 12,
                resolution: [width, height],
                frames: [],
                frame: 0
            }, */
        {
            format: 'rgba',
            components: 4,
            bitdepth: 32,
            resolution: [width, height],
            frames: [],
            frame: 0
        }, {
            filename: '394x473.png',
            format: 'rgba',
            components: 4,
            bitdepth: 32,
            resolution: [640,  403],
            frames: [],
            frame: 0
        }, {
            filename: '150x44.png',
            format: 'rgba',
            components: 4,
            bitdepth: 32,
            resolution: [150,  44],
            frames: [],
            frame: 0
        }
    ].map(function(channel, idx) {
        var url = '../assets/' + (channel.filename || (channel.resolution.join('x') + '.' + channel.format)),
            ch = glayer.addChannel(channel),
            finish = function() {
                console.info('Finish download ' + url);
            };

        if (/\.png$/.test(url)) {
            getPixels(url, function(err, pixels) {
                if (err) {
                    console.log("Bad image path")
                    return
                }
                channel.frames.push(pixels.data);
                finish();
            });
            return channel;
        }
        http.get(url)
            .on('response', function(res) {
                res.pipe(new Chunker(ch.size))
                    .on('data', function(data) {
                        channel.frames.push(data);
                    })
                    .on('end', finish);
            });
        return channel;
    })

var engine = loop(function(dt) {
    glayer.channels.map(function(ch, idx) {
        var channel = channels[idx];
        channel.frame = ((channel.frame + 1) % channel.frames.length) | 0;
        ch.set(channel.frames[channel.frame]);
    });

    glayer.draw();
});

module.exports = {
    engine: engine,
    glayer: glayer,
    toggle: function() {
        engine.emit('toggle', (engine.running ? engine.stop() : engine.start()).running);
    },
    forward: function() {
        engine._frame = 100;
    },
    backward: function() {
        engine._frame = 0;
    },
    next: function() {

    },
    previousfunction() {

    }
}
