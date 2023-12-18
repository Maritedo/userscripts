function animater(element) {
    return new Animater(element)
}

class Animater {
    /** @type {{duration: number, timing: (value: number) => number, circle: boolean, value: number }} */
    static defaultOptions = {
        duration: 1000,
        timing: Animater.easeOutQuint,
        circle: false,
        value: 0
    };
    /** @type {{from: number, to: number, value: number}} */
    static defaultMeta = {
        from: 0,
        to: 1,
        value: 0
    };
    /** @type {Element} */
    element;
    /** @type {{ states: { tick: { last: number, start: number }, pad: number, flag: boolean, start: number, target: number, current: number, newValue: number, completed: boolean }, values: Map<string, { from: number, to: number, value: number }> , timing: (e: number) => number, duration: number, circle: boolean }[]} */
    propertyGroups = [];
    /** @type {(()=>any)[]} */
    proxies = [];
    /** @type {boolean} */
    lock = false;

    constructor(element) {
        this.element = element;
    }

    onTick() {
        let completed = true;
        for (const prop of this.propertyGroups) {
            const states = prop.states;
            if (states.flag) {
                states.flag = false;
                states.pad = (states.target = states.newValue) - (states.start = states.current);
                states.tick.start = states.tick.last;
            }
            const tick = Date.now();
            states.tick.last = tick;
            if (states.completed) continue;
            else if (states.current == states.target) {
                states.start = states.target;
                states.completed = true;
                continue;
            }

            completed = false;
            const offset = (states.target - states.start) / (states.target - states.current);
            const offsetTime = keepInside(0, (tick - states.tick.start) / prop.duration, 1);
            if (offset < 0.001) states.current = states.target;
            else {
                if (prop.circle) {
                    const route1 = states.target - states.start;
                    const delta = Math.abs(route1);
                    const route2 = (states.target - states.start) > 0 ? (delta - 1) : (1 - delta);
                    const route = delta < 0.5 ? route1 : route2;
                    states.current = (1 + states.start + route * prop.timing(offsetTime)) % 1;
                } else {
                    states.current = states.start + states.pad * prop.timing(offsetTime);
                }
            }
            for (const key of prop.values.keys()) {
                const values = prop.values.get(key);
                const { from, to } = values;
                const next = from + (to - from) * states.current;
                values.value = next;
            }
        }
        if (completed) this.lock = false;
        else {
            this.proxies.forEach(e => e(this.propertyGroups));
            requestAnimationFrame(() => this.onTick());
        }
    }

    proxy(callback) {
        this.proxies.push(callback);
        return this;
    }

    unregistryProxy(callback) {
        const re = [];
        this.proxies.forEach(e => {
            if (e !== callback) re.push(e)
        });
        this.proxies = re;
    }

    /**
     * @param {{ states: { tick: { last: number, start: number }, pad: number, flag: boolean, start: number, target: number, current: number, newValue: number, completed: boolean }, values: Map<string, { from: number, to: number, value: number }> , timing: (e: number) => number, duration: number, circle: boolean }} propGroup 
     * @param {number} defaultVal
     */
    gen(propGroup, defaultVal = 0) {
        let then;
        const go = (value) => {
            if (propGroup.states.target != value) {
                propGroup.states.completed = false;
                if (!this.lock) {
                    this.lock = true;
                    propGroup.states.tick.last = propGroup.states.tick.start = Date.now();
                    propGroup.states.pad = (propGroup.states.target = value) - propGroup.states.start;
                    this.onTick();
                } else {
                    propGroup.states.newValue = value;
                    propGroup.states.flag = true;
                }
            }
            return then;
        }
        const reset = () => go(defaultVal);
        const get = (keyName) => propGroup.values.get(keyName).value;
        then = { go, reset, get };
        return then;
    }

    property(prop, options) {
        const props = new Map();
        const _animater_ = this;
        const group = (options) => {
            const { timing, duration, circle, value } = Object.assign({}, Animater.defaultOptions, options);
            const propGroup = {
                states: {
                    tick: {
                        last: 0,
                        start: 0
                    },
                    pad: 0,
                    flag: false,
                    start: value,
                    target: value,
                    current: value,
                    newValue: 0,
                    completed: true
                },
                values: props,
                timing,
                circle,
                duration
            };
            _animater_.propertyGroups.push(propGroup);
            return _animater_.gen(propGroup, value);
        }
        const property = (prop, options) => {
            const { from, to, value } = Object.assign({}, Animater.defaultMeta, options);
            props.set(prop, { from, to, value });
            return { property, group };
        }
        return property(prop, options);
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