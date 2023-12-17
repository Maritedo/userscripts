/**
 * 
 * @param {Element} element 
 * @param {{duration: number, timing: }} options
 */
function animater(element) {
    /**  @type {Element} */
    const ELE = element;
    /** @type {Map<string, (typeof defaultPropOpt)[]>} */
    const properties = new Map();
    const TIMER = new Timer(0, onTick, onEnd);
    const _FROM = new WeakMap();
    const _COMP = new WeakMap();
    const _PROG = new WeakMap();
    const _LAST = new WeakMap();

    function onTick(current) {
        for (const key of properties.keys()) {
            let valueList = properties.get(key);
            for (const i in valueList) {
                const value = valueList[i];
                if (_PROG.get(value)) {
                    valueList[i].from = _LAST.get(value);
                    valueList[i].to = _PROG.get(value);
                    _PROG.set(value, undefined);
                    _COMP.set(value, false);
                    TIMER.pause().reset().start();
                }
                let { from, to, timing, proxy, getter, duration, offset } = value;
                if (!_COMP.get(value) && current >= offset) {
                    if (current < offset + duration) {
                        if (from === null) {
                            let cached = _FROM.get(value);
                            if (!cached)
                                _FROM.set(value, (from = getter(ELE.style[key])));
                            else
                                from = cached;
                        }
                        const curValue = timing(from, to, duration, Math.max(0, current - offset));
                        _LAST.set(value, curValue);
                        ELE.style.setProperty(
                            key,
                            proxy(
                                curValue
                            )
                        );
                    }
                    else _COMP.set(value, true);
                }
            }
        }
    }

    function onEnd() {
        for (const valueList of properties.values()) {
            for (let value of valueList) {
                _FROM.set(value, undefined);
                _COMP.set(value, false);
            }
        } -
    }

    const then = {
        property,
        invoke,
        element: ELE,
        properties
    };

    /** @type {{from: number, to: number, timing: (from: number, to: number, duration: number, current: number) => number, proxy: (value: number) => number, getter: (value: number) => number, duration: number, offset: number}} */
    const defaultPropOpt = {
        from: null,
        to: 1,
        timing: animater.ease,
        proxy: e => e,
        getter: e => e,
        duration: 2000,
        offset: 0
    }
    /**
     * @param {string} prop 
     * @param {defaultPropOpt & { from: number}} options 
     */
    function property(prop, options) {
        let { from, to, timing, proxy, getter, duration, offset } = Object.assign({}, defaultPropOpt, options);
        const value = { from, to, timing, proxy, getter, duration, offset };
        if (!properties.get(prop))
            properties.set(prop, []);
        properties.get(prop).push(value);
        return (e) => _PROG.set(value, e);
    }

    function invoke() {
        let maxDuration = 0;
        for (const valueList of properties.values()) {
            for (let value of valueList) {
                _FROM.set(value, null);
                _COMP.set(value, false);
                maxDuration = Math.max(maxDuration, value.duration + value.offset);
            }
        }
        TIMER.duration = maxDuration;
        if (TIMER.paused)
            TIMER.reset().start()
        else
            TIMER.pause(_ => {
                TIMER.reset().start();
            });
        return then;
    }

    return then;
}

const timingFn = (fn) => (from, to, duration, current) => {
    const pad = to - from;
    const per = keepInside(0, current / duration, 1);
    return from + fn(per) * pad;
}

function easeOutQuint(x) {
    return 1 - Math.pow(1 - x, 5);
}

function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

animater.ease = timingFn(easeInOutCubic);
animater.easeIn = timingFn(easeOutQuint);

function keepInside(min, val, max) {
    return Math.max(Math.min(val, max), min)
}

class Timer {
    duration;
    onUpdateCallback;
    onEndCallback;
    onPausedCallback;
    remainedTime;
    _lastStart = 0;
    resetFlag = false;

    _paused = true;
    get paused() {
        return this._paused;
    }
    set paused(val) {
        this._paused = val;
        if (!val) {
            this._lastStart = Date.now();
            this.__frame__(this);
        }
    }

    constructor(duration, onUpdateCallback, onEndCallback) {
        this.duration = duration;
        this.remainedTime = duration;
        this.onUpdateCallback = onUpdateCallback;
        this.onEndCallback = onEndCallback;
    }

    reset() {
        if (this.paused) {
            this.__reset__();
        } else {
            this.resetFlag = true;
            this.paused = true;
        }
        return this;
    }

    start() {
        if (this.paused) {
            this.paused = false;
            this.onUpdateCallback && this.onUpdateCallback(0);
        }
        return this;
    }

    pause(onPausedCallback = null) {
        this.paused = true;
        this.onPausedCallback = onPausedCallback;
        return this;
    }

    __frame__(timer) {
        if (!timer.paused) {
            const timeNow = Date.now();
            const timeLasted = timeNow - timer._lastStart
            if (timeLasted < timer.remainedTime) {
                timer.onUpdateCallback && timer.onUpdateCallback(timeLasted);
                requestAnimationFrame(() => timer.__frame__(timer));
            } else {
                timer.__end__();
            }
        } else {
            if (timer.resetFlag) {
                timer.__reset__();
            }
            this.onPausedCallback && this.onPausedCallback();
        }
    }

    __reset__() {
        this.resetFlag = false;
        this.remainedTime = this.duration;
    }

    __end__() {
        this.remainedTime = 0;
        this.paused = true;
        this.onUpdateCallback && this.onUpdateCallback(this.duration);
        this.onEndCallback && this.onEndCallback();
    }
}