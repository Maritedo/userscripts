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
        value: 0
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
                if (prop.circle) {
                    states.start = states.current = getFixed(states.current);
                    const target = getFixed(states.newValue);
                    const distance = Math.abs(states.start - target);
                    if (distance > 0.5)
                        states.target = (target > states.start) ? (target - 1) : (target + 1);
                    else
                        states.target = target;
                } else {
                    states.start = states.current;
                    states.target = keepInside(0, states.newValue, 1);
                }
                states.pad = states.target - states.start;
            }
            // 记录时刻
            const tick = Date.now();
            states.tick.last = tick;
            // 标记并跳过已完成项目
            if (states.completed) continue;
            else if (states.current == states.target) {
                states.completed = true;
                continue;
            }
            // 处理仍需处理的项目
            completed = false;
            // 计算偏移值
            const offset = (states.target - states.start) / (states.target - states.current);
            const offsetTime = Math.min(1, (tick - states.tick.start) / prop.duration);
            if (Math.abs(offset) < 0.01) {
                if (prop.circle) states.target %= 1
                states.current = states.start = states.target;
            }
            else
                states.current = states.start + states.pad * prop.timing(offsetTime);
            for (const values of prop.values.values()) {
                const { from, to } = values;
                if (prop.circle)
                    values.value = from + (to - from) * getFixed(states.current);
                else
                    values.value = from + (to - from) * states.current;
            }
        }
        if (completed) {
            this.lock = false;
            for (const prop of this.propertyGroups) {
                prop.states.start = prop.states.target;
            }
        }
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
                if (propGroup.states.isContinous) {
                    value += propGroup.states.checkPoint
                }
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
        const store = () => {
            propGroup.states.checkPoint = propGroup.states.current;
            propGroup.states.isContinous = true;
            return then;
        }
        const unstore = () => {
            propGroup.states.isContinous = false;
            return then;
        }
        const set = (value) => {
            propGroup.states.completed = true;
            propGroup.states.target = propGroup.states.start = propGroup.states.target = value;
            propGroup.states.pad = 0;
        }
        const reset = () => go(defaultVal);
        const get = (keyName) => propGroup.values.get(keyName).value;
        return (then = { go, set, store, unstore, reset, get });
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
                    completed: true,
                    checkPoint: value,
                    isContinous: false
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