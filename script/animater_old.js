/**
 * 
 * @param {Element} element 
 * @param {{duration: number, timing: (value: number) => number }} options
 */
function animater(element, options) {
    const defaultOptions = {
        duration: 100,
        timing: easeOutQuint
    };

    /** @type {{duration: number, timing: (value: number) => number }} */
    const { duration, timing } = Object.assign({}, defaultOptions, options);

    /**  @type {Element} */
    const ELE = element;

    /** @type {Map<string, (typeof defaultPropOpt)[]>} */
    const properties = new Map();
    let proxies = [];

    let pad = 0;
    let flag = false;
    let start = 0;
    let target = 0;
    let current = 0;
    let newValue = 0;

    let lastTick, startTick;
    let lock = false;

    function onTick() {
        if (flag) {
            flag = false;
            pad = (target = newValue) - (start = current);
            startTick = lastTick;
        }
        if (current == target) return (lock = false, (start = target))
        const tick = Date.now();
        const offset = (target - start) / (target - current);
        const offsetTime = keepInside(0, (tick - startTick) / duration, 1);
        current = offset < 0.001 ? target : start + pad * timing(offsetTime);
        for (const key of properties.keys()) {
            const { from, to, proxy } = properties.get(key);
            proxy && proxy(key, from + (to - from) * current, ELE);
        }
        lastTick = tick;
        proxies.forEach(e => e(properties));
        requestAnimationFrame(() => onTick())
    }

    /** @param {number} percent  */
    function go(value) {
        if (value != target) {
            if (!lock) {
                lock = true;
                startTick = Date.now();
                pad = (target = value) - start;
                onTick();
            } else {
                newValue = value;
                flag = true;
            }
        }
        return then;
    }

    function proxy(callback) {
        proxies.push(callback);
    }

    function unregistryProxy(callback) {
        const re = [];
        proxies.forEach(e => {
            if (e !== callback) re.push(e)
        });
        proxies = re;

    }

    const then = {
        property,
        go,
        proxy,
        element: ELE,
        properties
    };

    /** @type {{from: number, to: number, proxy: (value: number) => number, getter: (value: number) => number}} */
    const defaultPropOpt = {
        from: 0,
        to: 1,
        proxy: (k, v, e) => e.style.setProperty(k, `${v}px`),
        getter: e => e
    }

    /**
     * @param {string} prop 
     * @param {defaultPropOpt & { from: number}} options 
     */
    function property(prop, options) {
        const { from, to, proxy, getter } = Object.assign({}, defaultPropOpt, options);
        properties.set(prop, { from, to, proxy, getter });
        return then;
    }

    return then;
}

animater.asGroup = (...animaters) => {

}

/**
 * @returns {(from: number, to: number, duration: number, current: number) => number}
 */
function timingFn(fn) {
    return function (from, to, duration, current) {
        const pad = to - from;
        const per = keepInside(0, current / duration, 1);
        return from + fn(per) * pad;
    }
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