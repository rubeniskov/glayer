import EventEmitter from "events";
import {
    requestAnimationFrame,
    cancelAnimationFrame
} from "./animation-frame";

/*
    frameskip
    framerate
    framelengh
    duration
    samplerate
*/

export default class Player extends EventEmitter {
    static STATE_STOPPED = 0x0
    static STATE_PAUSED = 0x1
    static STATE_PLAYING = 0x2
    static STATE_AVANCE = 0x3
    static STATE_REWIND = 0x4
    constructor(options) {
        var self = super();
        this.options = options;
        this.rafid = 0;
        this.ltt = 0;
        this.framelength = 1 / 1;
        this.stop();
    }
    animate(time) {
        var self = this;
        self.ltt = 0;
        return (function animate() {
            var current = time ||  self.time(),
                delta = current - self.ltt;
            if (delta >= self.framelength) {
                self.tick(current, ~~(1 / delta) + 1)
                self.ltt = current;
            }
            // setTimeout(function() {
                self.rafid = requestAnimationFrame(animate);
            // }, delta * 600);
        })();
    }
    cancel() {
        cancelAnimationFrame(this.rafid);
    }
    tick(time, diff) {
        var self = this;
        requestAnimationFrame(function() {
            self.emit('tick', ~~((1 / self.framelength) * time) + 1, time, diff);
        });
    }
    timestamp() {
        return new Date().getTime();
    }
    time() {
        return this.timestamp();
    }
    play() {
        if (this._state !== Player.STATE_PLAYING) {
            this.animate();
            this._state = Player.STATE_PLAYING;
            this.emit('play')
        }
        return this;
    }
    stop() {
        if (this._state !== Player.STATE_STOPPED) {
            this.pause();
            this._state = Player.STATE_STOPPED;
            this.emit('stop');
        }
        return this;
    }
    pause() {
        if (this._state !== Player.STATE_PAUSED) {
            this._state = Player.STATE_PAUSED;
            this.emit('pause');
            this.cancel();
        }
        return this;
    }
    toggle() {
        return (this._state === Player.STATE_PLAYING ? this.pause : this.play).call(this);
    }
    skim(time) {
        if (this._state !== Player.STATE_PLAYING)
            this.tick(time);
    }
    seek(time) {
        this.ltt = time;
        this.emit('seek', time);
    }
    avance() {

    }
    rewind() {
        this.seek(0);
        this.emit('rewind');
    }
    backward() {
        this.seek(0);
        this.emit('backward');
    }
    forward() {
        this.emit('forward');
    }
    is(state) {
        return this._state === Player[('STATE_' + state || '').toUpperCase()];
    }
    state() {
        return this._state;
    }
}
