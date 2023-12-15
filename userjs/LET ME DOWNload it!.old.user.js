// ==UserScript==
// @name         LET ME DOWNload it! DEV
// @namespace    https://userjs.justtryit.top/
// @version      0.1.0
// @description
// @author       blairollie63@gmail.com
// @match        *://*.ai-augmented.com/*
// @run-at       document-start
// @grant        GM_download
// @updateURL    https://userjs.justtryit.top/LET%20ME%20DOWNload%20it!.min.user.js
// @downloadURL  https://userjs.justtryit.top/LET%20ME%20DOWNload%20it!.min.user.js
// @installURL   https://userjs.justtryit.top/LET%20ME%20DOWNload%20it!.min.user.js
// @supportURL   https://userjs.justtryit.top/
// ==/UserScript==

(function () {
    'use strict';

    const useDebug = true;
    const catchConsole = true;
    const console_log = console.log;
    // const console_info = console.info;
    // const console_warn = console.warn;
    // const console_error = console.log;
    if (catchConsole) {
        console.log = _ => null;
        console.info = _ => null;
        console.warn = _ => null;
        console.error = _ => null;
    }

    function log(...objs) {
        if (!useDebug) return;
        const error = new Error();
        const callerLine = error.stack.split('\n')[2].trim().split(':');
        const len = callerLine.length - 2;
        console_log(`[LMDI:${callerLine[len]}]`, ...objs);
    }

    let name = "", href = "";
    let exits = false;
    let label, anchor, progressBar, progressCircle;
    let setAnchorAttr;

    const color = {
        def: "#ffad1698",
        blk: "#3339"
    };
    const progressColor = "#3498db";

    log("插件已运行");

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

    function download() {
        if (!exits) return alert("未找到资源");
        log(`尝试下载${name}: ${href}`);
        downloadName(href, name);
    }

    function setProgress(percent) {
        var circumference = 2 * Math.PI * (progressCircle.getAttribute('r') || 48);
        var offset = circumference - percent * circumference;
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = offset;
    }

    function initProgress() {
        var circumference = 2 * Math.PI * (progressCircle.getAttribute('r') || 48);
        progressCircle.style.stroke = progressColor;
        progressCircle.style.strokeDasharray = circumference;
        progressCircle.style.strokeDashoffset = 0;
    }

    function clearProgress() {
        progressCircle.style.stroke = "#0000";
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
            const title = document.querySelector("div.node-item div.node-selected div.node-inner");
            if (title && iframe.src && iframe.src.indexOf('furl') >= 0) {
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
            .on(".ta-frame");

        listenerElements('video', (video) => {
            const title = document.querySelector("div.node-item div.node-selected div.node-inner");
            if (video) {
                log("等待视频载入");
                const mutationObserver = new MutationObserver(mutations => {
                    if (Array.from(mutations).find(mutation => {
                        if (mutation.type == "attributes" && mutation.attributeName == "src") {
                            return true;
                        }
                        return false
                    })) {
                        log("更新完成");
                        href = video.src;
                        name = title.textContent;
                        state.okay()
                    }
                });
                mutationObserver.observe(video, {
                    attributes: true
                })
            } else {
                log("更新失败", video);
                state.empty()
            }
        })
            .on(".ta-frame")
    }

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
                    f(ele)
                } else {
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

    const downloader = {
        onerror: () => {
            log("下载错误");
            clearProgress();
            lock = false;
        },
        onload: () => {
            log("下载完成");
            clearProgress();
            lock = false;
        },
        onprogress: (progressEvent) => {
            if (progressEvent.lengthComputable) {
                setProgress(progressEvent.loaded / progressEvent.total);
            }
        },
        ontimeout: () => {
            log("下载超时");
            clearProgress();
            lock = false;
        },
    }

    var lock = false;
    const method = {
        BROWSER: 1,
        FETCH: 2,
        GMAPI: 3
    };
    const useMethod = method.GMAPI;
    function downloadName(url, filename) {
        if (!lock) {
            switch (useMethod) {
                case method.BROWSER:
                    downloadViaBrowser(url, filename);
                    break;
                case method.FETCH:
                    lock = true;
                    downloadViaFetch(url, filename);
                    break;
                case method.GMAPI:
                    lock = true;
                    initProgress();
                    GM_download({
                        url: url, //从中下载数据的URL（必填）
                        name: filename, //文件名- 出于安全原因，需要在Tampermonkey的选项页上将文件扩展名列入白名单（必填）
                        // headers, //有关详细信息，请参阅GM_xmlhttpRequest
                        saveAs: false, //布尔值，显示一个另存为对话框
                        onerror: downloader.onerror, //如果此下载以错误结束，则执行回调
                        onload: downloader.onload, //下载完成后要执行的回调
                        onprogress: downloader.onprogress, // 如果此下载取得一些进展，则执行回调
                        ontimeout: downloader.ontimeout, //超时回调 如果此下载由于超时而失败，则执行回调
                    });
                    break;
                default:
                    log("INTERNAL ERROR");
            }
        } else {
            log("下载进行中");
        }
    }

    /**
     * @param {Blob} blob
     */
    function saveBlob(blob, filename) {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        a.target = '_blank';
        a.click();
        URL.revokeObjectURL(blobUrl)
    }

    function downloadViaBrowser(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        a.click();
    }

    async function downloadViaFetch(url, filename) {
        try {
            const response = await fetch(url, {
                mode: 'cors'
            });
            if (!response.ok) {
                lock = false;
                return log("错误！", response.status);
            }
            if (stream) {
                const reader = response.body.getReader();
                const contentLength = +response.headers.get('Content-Length');
                let receivedLength = 0; // 当前接收到了这么多字节
                const chunks = []; // 接收到的二进制块的数组（包括 body）
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        lock = false;
                        break;
                    }
                    chunks.push(value);
                    receivedLength += value.length;

                    console.log(`${receivedLength} / ${contentLength}`)
                }

                // Step 4：将块连接到单个 Uint8Array
                let chunksAll = new Uint8Array(receivedLength); // (4.1)
                let position = 0;
                for (let chunk of chunks) {
                    chunksAll.set(chunk, position); // (4.2)
                    position += chunk.length;
                }
                saveBlob(new Blob(chunksAll), filename)
            } else {
                response
                    .then(async res => {
                        let blob = await res.blob();
                        return blob
                    })
                    .then(blob => {
                        saveBlob(blob, filename);
                        lock = false
                    })
            }
        } catch (e) {
            lock = false;
            log(e);
        }
    }

    function createButton() {
        const width = 12 / 2;
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
                h("div", {
                    style: {
                        width: "48px",
                        height: "48px",
                        position: "relative"
                    }
                })
                    .child(
                        (progressBar = h("svg", {
                            xmlns: xmlns.svg,
                            viewBox: "0 0 100 100",
                            width: "48",
                            height: "48",
                            style: {
                                display: "inline-block",
                                width: "48px",
                                height: "48px"
                            }
                        })
                            .child(
                                (progressCircle = h("path", {
                                    xmlns: xmlns.svg,
                                    fill: "none",
                                    style: {
                                        transitonProperty: "stroke-dasharray stroke-dashoffset stroke",
                                        transitonDuration: ".2s",
                                        transitonTimingFunction: "ease",
                                        stroke: progressColor,
                                        strokeWidth: `${2 * width}`
                                    },
                                    d: `M50 ${width} a ${50 - width} ${50 - width} 0 0 1 0 ${100 - 2 * width} a ${50 - width} ${50 - width} 0 0 1 0 -${100 - 2 * width}`
                                })
                                    .final())
                            )
                            .final())
                    )
                    .child(
                        (anchor = h("a", {
                            textContent: "下载",
                            style: {
                                display: "inline-block",
                                color: "#000",
                                lineHeight: "48px",
                                position: "absolute",
                                width: "100%",
                                textAlign: "center",
                                left: "0",
                                top: "0"
                            }
                        })
                            .listen("click", evt => {
                                evt.preventDefault();
                                download()
                            })
                            .final())
                    )
            )
            .append());

        return (url, name) => {
            anchor.title = name;
            anchor.href = url;
            anchor.download = name;
        }
    }

    const parseKey = (key) => {
        let i = key.length;
        while (i-- > 1) {
            const charCode = key.charCodeAt(i)
            if (charCode < 91 && charCode > 64) {
                key = key.slice(0, i) + '-' + String.fromCharCode(charCode | 32) + key.slice(i + 1);
            }
        }
        return key
    }

    const xmlns = {
        svg: "http://www.w3.org/2000/svg",
        math: "http://www.w3.org/1998/Math/MathML"
    }
    const nonAttrKeys = ['innerHTML', 'textContent', 'innerText'];
    function h(tag, attrs = null) {
        /** @type {HTMLElement} */
        let ele;
        if (attrs && attrs.xmlns)
            ele = document.createElementNS(attrs.xmlns, tag);
        else
            ele = document.createElement(tag);

        if (typeof attrs === "object") {
            if (attrs)
                for (const key in attrs)
                    if ("xmlns" !== key.toLowerCase())
                        if (typeof attrs[key] === 'object' && attrs[key] !== null) {
                            Object.assign(ele[key], attrs[key]);
                        } else {
                            if (nonAttrKeys.includes(key))
                                ele[key] = attrs[key];
                            else
                                ele.setAttribute(key, attrs[key]);
                        }
        } else throw new Error("参数非合法对象属性选项")

        const then = {
            child, append, modify, final, listen
        }

        function final() {
            return ele
        }

        function append() {
            return (document.body.appendChild(ele), ele)
        }

        function listen(typ, cab) {
            return (ele.addEventListener(typ, cab), then)
        }

        function modify(f) {
            return (f(ele), then)
        }

        function child(obj) {
            if (obj instanceof Element)
                ele.appendChild(obj)
            else if (typeof obj == "string")
                ele.innerHTML += obj;
            else if (obj.final)
                ele.appendChild(obj.final());
            else
                log("尝试增加非法子节点");

            return then
        }

        return then
    }
})()