module.exports = (function(Player) {

    Player.prototype.process = function(event) {
        var channelCount, channels, data, i, n, outputBuffer, _i, _j, _k, _ref;
        outputBuffer = event.outputBuffer;
        channelCount = outputBuffer.numberOfChannels;
        channels = new Array(channelCount);
        for (i = _i = 0; _i < channelCount; i = _i += 1) {
            channels[i] = outputBuffer.getChannelData(i);
        }
        data = new Float32Array(this.bufferSize);
        this.callback(data);
        // if (this.resampler) {
        //     data = this.resampler.resampler(data);
        // }
        for (i = _j = 0, _ref = outputBuffer.length; _j < _ref; i = _j += 1) {
            for (n = _k = 0; _k < channelCount; n = _k += 1) {
                channels[n][i] = data[i * channelCount + n];
            }
        }
    }

    Player.prototype.init = function(sampleRate, channels, callback) {
        this._lastTime = 0;
        this._currentTime = 0;

        this.sampleRate = sampleRate;
        this.channels = channels;
        this.process = this.process.bind(this);
        this.context = new(window.AudioContext || window.webkitAudioContext)();
        this.deviceSampleRate = this.context.sampleRate;
        this.samples = 1 << 14 // MIN  11 // MAX 14;
        this.bufferSize = Math.ceil(this.samples / (this.deviceSampleRate / this.sampleRate) * this.channels);
        this.bufferSize += this.bufferSize % this.channels;
        this.callback = callback || function() {};
        this.reset();
        this.pause();
    }

    Player.prototype.reset = function(){
        this.node && this.node.disconnect();
        this.analyser && this.node.disconnect();

        this.node = this.context.createScriptProcessor(this.samples, this.channels, this.channels);
        this.analyser = this.context.createAnalyser();
        this.node.onaudioprocess = this.process;

        this.node.connect(this.context.destination);
        this.node.connect(this.analyser);
    }

    Player.prototype.currentTime = function(){
        var time = this.context.currentTime;
        this._currentTime += (time - this._lastTime);
        this._lastTime = time;
        return this._currentTime;
    }

    Player.prototype.frequency = function(){
        var buffer = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(buffer)
        return buffer;
    }

    // Player.prototype.process = function(e) {
    //     var data = e.outputBuffer.getChannelData(0);
    //     for (var i = 0; i < data.length; ++i) {
    //         data[i] = Math.sin(this.x++);
    //     }
    // }

    Player.prototype.seek = function(time){
        this._currentTime = Math.max(time, 0);
        this._lastTime = this.context.currentTime;
        this.reset();
    }

    Player.prototype.rewind = function(){
        this.seek(0);
    }

    Player.prototype.play = function() {
        this.context.resume();
    }

    Player.prototype.pause = function() {
        // this.node.disconnect();
        // this.analyser.disconnect();
        this.context.suspend();
    }

    Player.prototype.destroy = function() {
      return this.node.disconnect(0);
    };

    Player.prototype.getDeviceTime = function() {
      return this.context.currentTime * this.sampleRate;
    };

    return Player;

})(function Player(sampleRate, channels, callback) {
    if (sampleRate && channels)
        this.init(sampleRate, channels, callback);
})
