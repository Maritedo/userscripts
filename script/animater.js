function animater(element) {
    return new Animater(element)
}

/**
 * @param {Element} element 
 * @param {{duration: number, timing: (value: number) => number }} options
 */
class Animater {
    /** @type {{duration: number, timing: (value: number) => number }} */
    static defaultOptions = {
        duration: 3000,
        timing: Animater.easeOutQuint,
        circle: false,
        value: 0
    };

    /** @type {Element} */
    element;

    proxies = [];

    constructor(element) {
        this.element = element;
    }

    lock = false;

    onTick() {
        let completed = true;
        for (const prop of this.propertyGroups) {
            const states = prop.states;
            if (states.flag) {
                states.flag = false;
                states.pad = (states.target = states.newValue) - (states.start = states.current);
                states.tick.start = states.tick.last;
            }
            if (states.current == states.target) {
                states.start = states.target;
                continue;
            }
            completed = false;
            const tick = Date.now();
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
                const { from, to, value } = values;
                const next = from + (to - from) * states.current;
                values.value = next;
            }
            states.tick.last = tick;
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

    /** @type {{ states: { tick: { last: number, start: number }, pad: number, flag: boolean, start: number, target: number, current: number, newValue: number }, values: Map<string, { from: number, to: number, value: number }> , timing: (e: number) => number, duration: number, circle: boolean }[]} */
    propertyGroups = [];

    static defaultMeta = {
        from: 0,
        to: 1,
        value: 0
    };

    /**
     * @param {{ states: { tick: { last: number, start: number }, pad: number, flag: boolean, start: number, target: number, current: number, newValue: number }, values: Map<string, { from: number, to: number, value: number }> , timing: (e: number) => number, duration: number, circle: boolean }} propGroup 
     */
    gen(propGroup, defaultVal = 0) {
        const go = (value) => {
            if (value != propGroup.states.target) {
                if (!this.lock) {
                    this.lock = true;
                    propGroup.states.tick.start = Date.now();
                    propGroup.states.pad = (propGroup.states.target = value) - propGroup.states.start;
                    this.onTick();
                } else {
                    propGroup.states.newValue = value;
                    propGroup.states.flag = true;
                }
            }
            return this;
        }
        const reset = () => go(defaultVal);
        const get = (keyName) => propGroup.values.get(keyName).value;
        return {
            go,
            reset,
            get
        }
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
                    newValue: 0
                },
                values: props,
                timing,
                duration,
                circle
            };
            _animater_.propertyGroups.push(propGroup);
            return _animater_.gen(propGroup, value);
        }
        const property = (prop, options) => {
            const { from, to, value } = Object.assign({}, Animater.defaultMeta, options);
            props.set(prop, { from, to, value });
            return {
                property,
                group
            };
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

class AnimaterGroup {
    animaters = [];
    states = new Map();
    proxies = [];
    get values() {
        const _values_ = [];
        for (const animater of this.animaters) {
            const values = animater.values;
            for (const key of values.keys())
                _values_.push({
                    name: key,
                    value: values.get(key)
                })
        }
    }

    constructor(...animaters) {
        this.animaters.push(animaters);
        animaters.forEach(animater => {
            animater.proxy((e) => this.observer(e));
            this.states.set(animater, false);
        })
    }

    observer(animater) {
        this.states.set(animater, true);
        for (const value of this.states.values())
            if (!value) return;
        for (const anim of this.animaters)
            this.states.set(anim, false);
        this.proxies.forEach(p => p(this));
    }

    proxy(callback) {
        this.proxies.push(callback);
        return this;
    }
}

function keepInside(min, val, max) {
    return Math.max(Math.min(val, max), min)
}