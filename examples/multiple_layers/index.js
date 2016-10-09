var Glayer = require('../..'),
    http = require('http'),
    loop = require('raf-loop'),
    Chunker = require('stream-chunker'),
    width = 640,
    height = 360,
    glayer = new Glayer({
        canvas: document.getElementById('canvas'),
        width: width,
        height: height
    }),
    channels = [{
        format: 'yuv420p',
        components: 3,
        bitdepth: 12,
        resolution: [width, height],
        frames: [],
        frame: 0
    }, {
        format: 'rgba',
        components: 4,
        bitdepth: 32,
        resolution: [width, height],
        frames: [],
        frame: 0
    }].map(function(channel, idx) {
        http.get('../assets/' + width + 'x' + height + '.' + channel.format)
            .on('response', function(res) {
                var ch = glayer.addChannel(channel);
                res.pipe(new Chunker(ch.size)).on('data', function(chunk) {
                    channel.frames.push(chunk);
                }).on('end', function() {
                    console.info('Finish download');
                });
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
