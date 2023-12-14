// ==UserScript==
// @name         LET ME DOWNload it! DEV
// @namespace    https://userjs.justtryit.top/
// @version      0.1.0
// @description
// @author       blairollie63@gmail.com
// @match        *://*.ai-augmented.com/*
// @run-at       document-start
// @updateURL    https://userjs.justtryit.top/LET%20ME%20DOWNload%20it!.min.user.js
// @downloadURL  https://userjs.justtryit.top/LET%20ME%20DOWNload%20it!.min.user.js
// @installURL   https://userjs.justtryit.top/LET%20ME%20DOWNload%20it!.min.user.js
// @supportURL   https://userjs.justtryit.top/
// ==/UserScript==

(function () {
    'use strict';

    const useDebug = true;
    const console_log = console.log;
    // const console_info = console.info;
    // const console_warn = console.warn;
    // const console_error = console.log;
    console.log = _ => null;
    console.info = _ => null;
    console.warn = _ => null;
    console.error = _ => null;
    function log(...objs) {
        if (!useDebug) return;
        const error = new Error();
        const callerLine = error.stack.split('\n')[2].trim().split(':');
        const len = callerLine.length - 2;
        console_log(`[LMDI:${callerLine[len]}]`, ...objs);
    }

    let name = "", href = "";
    let exits = false;
    let label, anchor;
    let setAnchorAttr;
    let color = {
        def: "#ffad1698",
        blk: "#3339"
    };

    log("插件已运行");

    function download() {
        if (!exits) return alert("未找到资源");
        log(`尝试下载${name}: ${href}`);
        downloadName(href, name);
    }
    const state = {
        empty: () => {
            exits = false;
            label.style.backgroundColor = color.blk
        },
        okay: () => {
            exits = true;
            label.style.backgroundColor = color.def;
            setAnchorAttr(href, name);
            log("found", name, "at", href)
        }
    };

    function init() {
        listenerElements('iframe', (iframe) => {
            log("找到iframe");
            const title = document.querySelector("div.node-item div.node-selected div.node-inner");
            if (title && iframe.src) {
                log("更新成功");
                let url = iframe.src;
                href = url.slice(url.indexOf('furl') + 5/** 偏移值为"furl="的长度+1 */);
                name = title.textContent;
                state.okay()
            } else {
                log("更新失败");
                state.empty()
            }
        })
            .on(".ta-frame")
    }

    listenerElements
        (
            "#root",
            () => {
                log("注入按钮完成");
                setAnchorAttr = createButton();
            }
        )
        .then(
            "#xy_app_content",
            () => {
                log("监测到小雅主体加载完成")
            }
        )
        .then(
            "div.ta_panel.ta_panel_group.ta_group",
            () => {
                log("监测到课程页面加载完成")
            }
        )
        .on(
            "body", () => {
                log("页面载入完成");
                if (check(window, "unsafeWindow", "$history", "listen")) {
                    log("成功在unsafeWindow对象的路由中注入监听器");
                    window.unsafeWindow.$history.listen((location, action) => {
                        init();
                    });
                } else if (check(window, "$history", "listen")) {
                    log("成功在window对象的路由中注入监听器");
                    window.$history.listen((location, action) => {
                        init();
                    });
                } else {
                    log("未能将监听器注入到路由,仅当手动刷新页面时可以正常刷新下载");
                }
                init();
            }
        );

    function check(v, ...ls) {
        let vv = v, l;
        while ((l = ls.shift())) {
            if (vv[l]) vv = vv[l];
            else return false
        }
        return true
    }

    /**
     * @param {string[]} selectors
     */
    function listenerElements(selector, callback = null) {
        const callbacks = [];
        const selectors = [];
        let element;
        let finalCallback;

        function observeNext(father, selector, callback) {
            log("observing", selector);
            const promise = new Promise(resolve => {
                const f = (ele) => {
                    resolve();
                    let next;
                    element = ele;
                    if ((next = selectors.shift()))
                        observeNext(ele, next, callbacks.shift());
                    else if (finalCallback)
                        setTimeout(_ => finalCallback());
                };
                let ele;
                if ((ele = father.querySelector(selector)) !== null) {
                    log("DIRECT find", selector);
                    f(ele)
                }
                else {
                    log("SPYING element", selector);
                    (ele = new MutationObserver(mutations => {
                        mutations.find(mutation => {
                            return Array.from(mutation.addedNodes).find(node => {
                                if ((node.matches && node.matches(selector)) || (node.querySelector && (node = node.querySelector(selector)))) {
                                    ele.disconnect();
                                    f(node)
                                }
                                return false
                            })
                        })
                    })).observe(father, {
                        childList: true,
                        subtree: true
                    })
                }
            });
            callback && promise.then(() => callback(element))
        }

        function then(selector, callback = null) {
            selectors.push(selector);
            callbacks.push(callback);
            return { then, on }
        }

        function on(selector, callback = null) {
            finalCallback = callback;
            observeNext(document, selector, null)
        }

        return then(selector, callback)
    }

    function downloadName(url, filename) {
        fetch(url).then(async res => {
            let blob = await res.blob();
            return blob
        }).then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            a.target = '_blank';
            a.click();
            URL.revokeObjectURL(blobUrl)
        })
    }

    function createButton() {
        (label = h("label", {
            style: {
                cursor: "pointer",
                textDecoration: "none",
                userSelect: "none",
                "-webkit-user-select": "none",
                boxShadow: "0 -3px 8px -8px rgba(0, 0, 0, 0.1), 0 5px 6px 0 rgba(0, 0, 0, 0.1), 0 -8px 18px 5px rgba(0, 0, 0, 0.05)",
                position: "fixed",
                bottom: "48px",
                right: "48px",
                borderRadius: "24px",
                width: "48px",
                height: "48px",
                backgroundColor: color.blk,
                backdropFilter: "blur(3px)",
                "-webkit-backdrop-filter": "blur(3px)",
                transiton: "all .2s ease"
            }
        })
            .child(
                (anchor = h("a", {
                    textContent: "下载",
                    style: {
                        display: "inline-block",
                        color: "#000",
                        lineHeight: "48px",
                        width: "100%",
                        textAlign: "center"
                    }
                })
                    .listen("click", evt => {
                        evt.preventDefault();
                        download()
                    })
                    .final())
            )
            .append());

        return (url, name) => {
            anchor.title = name;
            anchor.href = url
        }
    }

    function h(tag, attrs = null) {
        const ele = document.createElement(tag);
        if (typeof attrs === "object") {
            if (attrs) {
                for (const key in attrs) {
                    if (typeof attrs[key] === 'object' && attrs[key] !== null) {
                        Object.assign(ele[key], attrs[key]);
                    } else {
                        ele[key] = attrs[key];
                    }
                }
            }
        } else {
            throw new Error("参数非合法对象属性选项")
        }

        function final() {
            return ele
        }

        function append() {
            document.body.appendChild(ele);
            return ele
        }

        function listen(typ, cab) {
            ele.addEventListener(typ, cab);
            return { child, append, modify, final, listen }
        }

        function modify(f) {
            f(ele);
            return { child, append, modify, final, listen }
        }

        function child(obj) {
            if (obj instanceof HTMLElement) {
                ele.appendChild(obj)
            } else {
                ele.appendChild(obj.final())
            }
            return { child, append, modify, final, listen }
        }

        return { child, append, modify, final, listen }
    }
})()