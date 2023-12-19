function animater(element) {
    return new Animater(element)
}

class Animater {
    /** @type {{duration: number, timing: (value: number) => number, circle: boolean, value: number }} */
    static defaultOptions = {
        duration: 600,
        timing: Animater.easeOutQuint,
        circle: false,
        value: 0
    };
    /** @type {{from: number, to: number, value: number}} */
    static defaultMeta = {
        from: 0,
        to: 1,
        value: null
    };
    /** @type {Element} */
    element;
    /** @type {{ states: { tick: { last: number, start: number }, pad: number, flag: boolean, start: number, target: number, current: number, newValue: number, completed: boolean, checkPoint: number, isContinous: boolean }, values: Map<string, { from: number, to: number, value: number }> , timing: (e: number) => number, duration: number, circle: boolean }[]} */
    propertyGroups = [];
    /** @type {(()=>any)[]} */
    payloads = [];
    /** @type {boolean} */
    lock = false;

    constructor(element) {
        this.element = element;
    }

    onTick() {
        let completed = true;
        for (const prop of this.propertyGroups) {
            const states = prop.states;
            // 异步接收到新数据
            if (states.flag) {
                states.flag = false;
                states.tick.start = states.tick.last;
                if (!prop.circle) {
                    states.target = keepInside(0, states.newValue, 1);
                } else if (!prop.states.isContinous) {
                    states.current = getFixed(states.current);
                    const target = getFixed(states.newValue);
                    const distance = Math.abs(states.start - target);
                    if (distance > 0.5)
                        states.target = (target > states.start) ? (target - 1) : (target + 1);
                    else
                        states.target = target;
                } else {
                    states.target = states.newValue;
                }
                states.start = states.current;
            }
            // 记录时刻
            const tick = Date.now();
            states.tick.last = tick;
            // 标记并跳过已完成项目
            if (states.completed) continue;
            else if (states.current == states.target) {
                states.start = states.target;
                states.completed = true;
                continue;
            }
            // 处理仍需处理的项目
            completed = false;
            // 计算偏移值
            const offset = (states.target - states.current) / (states.target - states.start);
            if (Math.abs(offset) <= 0.001) {
                if (prop.circle && !states.isContinous) states.target %= 1
                states.current = states.start = states.target;
                // states.pad = 0;
            }
            else {
                const offsetTime = Math.min(1, (tick - states.tick.start) / prop.duration);
                states.current = states.start + states.pad * prop.timing(offsetTime);
            }
            for (const values of prop.values.values()) {
                const { from, to } = values;
                if (prop.circle)
                    values.value = from + (to - from) * getFixed(states.current);
                else
                    values.value = from + (to - from) * states.current;
            }
        }
        if (completed) this.lock = false;
        else {
            this.payloads.forEach(e => e(this.propertyGroups));
            requestAnimationFrame(() => this.onTick());
        }
    }

    proxy(payload) {
        this.payloads.push(payload);
        return this;
    }

    unregistryProxy(callback) {
        const re = [];
        this.payloads.forEach(e => {
            if (e !== callback) re.push(e);
        });
        this.payloads = re;
    }

    /**
     * @param {{ states: { tick: { last: number, start: number }, pad: number, flag: boolean, start: number, target: number, current: number, newValue: number, completed: boolean, checkPoint: number, isContinous: boolean }, values: Map<string, { from: number, to: number, value: number }> , timing: (e: number) => number, duration: number, circle: boolean }} propGroup 
     * @param {number} defaultVal
     */
    gen(propGroup, defaultVal = 0) {
        let then;
        const go = (value) => {
            if (propGroup.states.target != value) {
                if (propGroup.states.isContinous)
                    value += propGroup.states.checkPoint;
                propGroup.states.completed = false;
                if (!this.lock) {
                    this.lock = true;
                    propGroup.states.tick.last = propGroup.states.tick.start = Date.now();
                    propGroup.states.target = value;
                    this.onTick();
                } else {
                    propGroup.states.newValue = value;
                    propGroup.states.flag = true;
                }
            }
            return then;
        }
        const store = () => {
            propGroup.states.checkPoint = propGroup.states.current;
            propGroup.states.isContinous = true;
            return then;
        }
        const unstore = () => {
            propGroup.states.isContinous = false;
            // if (this.lock) {
            //     propGroup.states.requireClean = true;
            //     console.log("wait")
            // } else {
            //     propGroup.states.target = getFixed(propGroup.states.target);
            //     propGroup.states.current = getFixed(propGroup.states.current);
            //     propGroup.states.start = getFixed(propGroup.states.start);
            //     console.log("instant")
            // }
            return then;
        }
        const set = (value) => {
            propGroup.states.completed = true;
            propGroup.states.target = propGroup.states.start = propGroup.states.target = value;
        }
        const reset = () => go(defaultVal);
        const get = (keyName) => propGroup.values.get(keyName).value;
        return (then = { go, set, get, reset, store, unstore });
    }

    property(prop, options) {
        const props = new Map();
        const _animater_ = this;
        const group = (options) => {
            const { timing, duration, circle, value } = Object.assign({}, Animater.defaultOptions, options);
            for (const values of props.values()) {
                const { from, to } = values;
                values.value = from + (to - from) * value;
            }
            const propGroup = {
                states: {
                    tick: {
                        last: 0,
                        start: 0
                    },
                    get pad() { return this.target - this.start },
                    flag: false,
                    start: value,
                    target: value,
                    current: value,
                    newValue: 0,
                    completed: true,
                    checkPoint: value,
                    isContinous: false,
                    // requireClean: false
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

function getFixed(value) {
    return value >= 0 ? (value % 1) : (1 - (-value) % 1) % 1;
}