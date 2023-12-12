// ==UserScript==
// @name         LET ME DOWNload it!
// @namespace    https://scripts.justtryit.top/
// @version      0.1.0
// @description  
// @author       Blairollie63@gmail.com
// @match        https://*.ai-augmented.com/*
// @run-at       document-end
// ==/UserScript==

(function (window, document) {
    'use strict';

    const useDebug = true;

    function log(...objs) {
        if (!useDebug) return;
        const error = new Error();
        const callerLine = error.stack.split('\n')[2].trim().split(':');
        const len = callerLine.length - 2;
        console.log(`[LMDI:${callerLine[len]}]`, ...objs);
    }

    let name = "", href = "";
    let iframe, title;

    function download() {
        log(`尝试下载${name}: ${href}`)
        downloadName(href, name);
    }

    function update() {
        /** @type {string} url*/
        iframe = document.querySelector('iframe');
        title = document.querySelector("h5.title.flex_panel.hor");
        let url = iframe.src;
        href = url.slice(url.indexOf('furl') + 5/** 偏移值为"furl="的长度+1 */);
        name = title.textContent;
    }

    window.onload = () => {
        log("Injected");
        listenerElements(
            "#root", () => {
                log("插入按钮");
                createButton();
            })
            .then(
                "#xy_app_content"
            )
            .then(
                "div.ta_panel.ta_panel_group.ta_group"
            )
            .final(
                _ => {
                    log("页面载入完成")
                    var observer = new MutationObserver(function (mutations) {
                        mutations.forEach(function (mutation) {
                            if (mutation.type === 'childList') {
                                update();
                            }
                        });
                    });
                    observer.observe(document.querySelector("div.group-resource-content"), {
                        childList: true
                    });
                    update();
                }
            )
            .on();
    }

    /**
     * @param {string[]} selectors
     */
    function listenerElements(selector, callback = null) {
        const callbacks = [callback];
        const promises = [];
        const elements = [document];
        const selectors = [selector];
        let finalCallback;
        let currentIndex = 0;

        function observeNext() {
            if (currentIndex < selectors.length) {
                const _selector = selectors[currentIndex];
                const targetElement = elements[elements.length - 1].querySelector(_selector);
                if (targetElement) {
                    elements.push(targetElement);
                    const promise = new Promise(resolve => {
                        const observer = new MutationObserver(mutations => {
                            if (mutations.some(mutation => mutation.addedNodes.length > 0)) {
                                observer.disconnect();
                                resolve();
                                currentIndex++;
                                observeNext();
                                const callback = callbacks.shift();
                                callback && callback();
                            }
                        });
                        observer.observe(targetElement, { childList: true, subtree: true });
                    });
                    promises.push(promise);
                } else {
                    setTimeout(() => log(`Element with selector "${_selector}" not found.`));
                    currentIndex++;
                    observeNext();
                }
            } else {
                setTimeout(() => finalCallback && finalCallback(), 1);
            }
        }

        function then(selector, callback = null) {
            selectors.push(selector);
            callbacks.push(callback);
            return { then, final, on };
        }

        function final(callback) {
            finalCallback = callback;
            return { on };
        }

        function on() {
            observeNext();
        }

        return { then, final, on };
    }

    function downloadName(url, filename) {
        fetch(url).then(async res => {
            let blob = await res.blob();
            return blob;
        }).then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = blobUrl;
            a.download = filename;
            a.target = '_blank';
            a.click();
            URL.revokeObjectURL(blobUrl);
        })
    }

    function createButton() {
        const _label = document.createElement("label");
        Object.assign(_label.style, {
            cursor: "pointer",
            textDecoration: "none",
            userSelect: "none",
            "-webkit-user-select": "none",
            boxShadow: "0 - 6px 8px - 8px rgba(0, 0, 0, 0.1), 0 - 9px 6px 0 rgba(0, 0, 0, 0.1), 0 - 12px 48px 16px rgba(0, 0, 0, 0.2)",
            position: "fixed",
            bottom: "48px",
            right: "48px",
            borderRadius: "24px",
            width: "48px",
            height: "48px",
            backgroundColor: "#6665",
            backdropFilter: "blur(3px)",
            "-webkit-backdrop-filter": "blur(3px)"

        });
        const _achor = document.createElement("a");
        Object.assign(_achor.style, {
            display: "inline-block",
            color: "#fff",
            lineHeight: "48px",
            width: "100%",
            textAlign: "center"
        });
        _achor.textContent = "下载";
        _achor.addEventListener("click", e => download());

        _label.appendChild(_achor);
        document.body.appendChild(_label);
    }
})(window, document);