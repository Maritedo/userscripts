const CACHE = new Map();
function $(selector, cache = false, env = document) {
    const ElementType = {
        DOCUMENT: 0,
        WINDOW: 1,
        ELEMENT: 2
    };

    let element, TYPE;
    const forEvery = (cbfn) => TYPE !== ElementType.ELEMENT ? cbfn(element) : element.forEach(ele => cbfn(ele));

    if (selector === document) {
        TYPE = ElementType.DOCUMENT;
        element = [selector];
    }
    else if (selector === window) {
        TYPE = ElementType.WINDOW;
        element = [selector];
    }
    else if (typeof selector === "string") {
        TYPE = ElementType.ELEMENT;
        if (!cache) {
            element = env.querySelectorAll(selector);
        }
        else if (!(element = CACHE.get({ selector, env }))) {
            element = env.querySelectorAll(selector);
            CACHE.set({ selector, env }, element);
        }
    }
    else if (selector instanceof Element) {
        TYPE = ElementType.ELEMENT;
        element = [selector];
    }
    else if (selector === null) {
        return null;
    }
    else {
        console.log(selector);
        throw new Error(selector);
    }

    function log() {
        forEvery(e => console.log(e));
        return then;
    }

    function remove() {
        if (TYPE === ElementType.ELEMENT)
            element.forEach(ele => {
                ele.parentElement && ele.parentElement.removeChild(ele);
            })
        return then;
    }

    function on(evtType, evtCallback) {
        forEvery(e => e.addEventListener(evtType, evtCallback));
        return then;
    }

    function off(evtType, evtCallback) {
        forEvery(e => e.removeEventListener(evtType, evtCallback));
        return then;
    }

    function addClass(...classes) {
        forEvery(e => {
            e.classList.add(...classes)
        });
        return then;
    }

    function removeClass(...classes) {
        forEvery(e => {
            e.classList.remove(...classes)
        });
        return then;
    }

    function toggleClass(...classes) {
        forEvery(e => {
            e.classList.toggle(...classes)
        });
        return then;
    }

    function hasClass(...classes) {
        return !classes.find(className => {
            return Array.from(element).find(ele => {
                return !ele.classList.contains(className)
            })
        })
    }

    function prop(propName, value) {
        forEvery(ele => {
            ele[propName] = value
        })
        return then;
    }

    function attr(attrName, value) {
        forEvery(ele => {
            ele.setAttribute(attrName, value);
        })
        return then;
    }

    function append(ls) {
        element.push(...ls);
    }

    function query(selector, cache = false) {
        let res;
        forEvery(e => {
            if (res) res.append($(selector, cache, e).eles);
            else res = $(selector, cache, e);
        })
        return res;
    }

    const then = {
        log,
        remove,
        on,
        off,
        toggleClass,
        addClass,
        removeClass,
        hasClass,
        every: (fn) => forEvery(e => fn($(e))),
        append,
        query,
        prop,
        attr,
        eles: element,
        get ele() { return $(element[0]) },
        get pure() { return element[0] },
        get parent() { return $(element[0].parentElement) },
        get next() { return $(element[0].nextElementSibling) },
        get prev() { return $(element[0].previousElementSibling) },
        get length() { return element.length }
    };
    return then;
    /**
     * 假定使用者不会傻到在$(document)或$(window)上尝试使用addClass之类的方法
     */
}