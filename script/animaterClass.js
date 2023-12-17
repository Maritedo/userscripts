/**
 * 
 * @param {Element} element 
 * @param {{duration: number, timing: (value: number) => number }} options
 */
class Animater {
    static defaultOptions = {
        duration: 1000,
        timing: Animater.easeOutQuint
    };

    /** @type {{duration: number, timing: (value: number) => number }} */
    duration;
    timing;
    /**  @type {Element} */
    ELE = element;

    /** @type {Map<string, (typeof defaultPropOpt)[]>} */
    properties = new Map();
    proxies = [];

    constructor(element, options) {
        ({ duration: this.duration, timing: this.timing } = Object.assign({}, defaultOptions, options));
    }

    pad = 0;
    flag = false;
    start = 0;
    target = 0;
    current = 0;
    newValue = 0;

    lastTick;
    startTick;
    lock = false;

    onTick() {
        if (this.flag) {
            this.flag = false;
            this.pad = (this.target = this.newValue) - (this.start = this.current);
            this.startTick = this.lastTick;
        }
        if (this.current == this.target) return (this.lock = false, (this.start = this.target))
        const tick = Date.now();
        const offset = (this.target - this.start) / (this.target - this.current);
        const offsetTime = keepInside(0, (tick - this.startTick) / this.duration, 1);
        this.current = offset < 0.001 ? this.target : this.start + this.pad * timing(offsetTime);
        for (const key of properties.keys()) {
            const { from, to, proxy } = properties.get(key);
            proxy && proxy(key, from + (to - from) * this.current, ELE);
        }
        this.lastTick = tick;
        this.proxies.forEach(e => e(this.properties));
        requestAnimationFrame(() => this.onTick())
    }

    /** @param {number} percent  */
    go(value) {
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


    proxy(callback) {
        proxies.push(callback);
    }

    unregistryProxy(callback) {
        const re = [];
        proxies.forEach(e => {
            if (e !== callback) re.push(e)
        });
        proxies = re;

    }

    /** @type {{from: number, to: number, proxy: (value: number) => number, getter: (value: number) => number}} */
    static defaultPropOpt = {
        from: 0,
        to: 1,
        proxy: (k, v, e) => e.style.setProperty(k, `${v}px`),
        getter: e => e
    }

    /**
     * @param {string} prop 
     * @param {defaultPropOpt & { from: number}} options 
     */
    property(prop, options) {
        const { from, to, proxy, getter } = Object.assign({}, defaultPropOpt, options);
        properties.set(prop, { from, to, proxy, getter });
        return then;
    }

    static asGroup(...animaters) {

    }

    static easeOutQuint(x) {
        return 1 - Math.pow(1 - x, 5);
    }

    static easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
}

function keepInside(min, val, max) {
    return Math.max(Math.min(val, max), min)
}