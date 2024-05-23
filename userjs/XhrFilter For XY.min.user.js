// ==UserScript==
// @name         XhrFilter For XY.min
// @namespace    666
// @version      0.1.2
// @description
// @author       anonymous
// @match        *://*.ai-augmented.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @connect      ai-augmented.com
// ==/UserScript==

(function (_w_) {
    function paternMatch(url, patern) {
        const reg = new RegExp(`^${patern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`, 'i');
        return reg.test(url);
    }

    function blob2textSync(blob) {
        var url = URL.createObjectURL(blob);//Create Object URL
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);//Synchronous XMLHttpRequest on Object URL
        xhr.overrideMimeType(blob.type);//Override MIME Type to prevent UTF-8 related errors
        xhr.send();
        URL.revokeObjectURL(url);
        return xhr.responseText;
    };

    const base_url = "*://*.ai-augmented.com/";
    const apis = {
        queryCourseResources: base_url + "api/jx-iresource/resource/queryCourseResources?group_id=*",
        queryResource: base_url + "api/jx-iresource/resource/queryResource?node_id=*"
    };
    const mime = {
        json: "application/json"
    };

    const XhrFilter = (function (_w) {
        /** @type {Map<string, Function[]>} */
        const filters = new Map();
        const getMatched = (url) => filters.entries().filter(entry => paternMatch(url, entry[0])).map(e => e[1]).toArray();

        const _proto_ = _w.XMLHttpRequest.prototype;
        const _ori_open_ = _proto_.open;
        const _ori_send_ = _proto_.send;
        const _ori_response_ = Object.getOwnPropertyDescriptor(_proto_, "response").get;
        const _ori_responseText_ = Object.getOwnPropertyDescriptor(_proto_, "responseText").get;
        const _ori_fetch_ = _w.fetch;

        function hijack(xhr, url) {
            if (xhr.readyState < _proto_.DONE || xhr._hijacked_) return;
            xhr._hijacked_ = true;
            const matched = getMatched(url);
            if (matched.length == 0) return;
            const isText = xhr.responseType == "text";
            let obj = (isText ? _ori_responseText_ : _ori_response_).call(xhr);
            for (const handlers of matched) {
                for (const handler of handlers) {
                    obj = handler(obj);
                }
            }
            xhr[isText ? "_responseText_" : "_response_"] = obj;
        }

        Object.assign(_proto_, {
            open() {
                this._url_ = arguments[1];
                _ori_open_.apply(this, arguments);
            },
            send() {
                const xhr = this;
                const url = xhr._url_ || "";
                xhr._hijacked_ = false;

                const targets = ["onload", "onreadystatechange"];
                for (const target of targets) {
                    const origin = xhr[target];
                    if (origin instanceof Function) {
                        xhr[target] = function () {
                            hijack(xhr, url);
                            origin.apply(this, arguments);
                        };
                    }
                };
                _ori_send_.apply(this, arguments);
            }
        });
        Object.defineProperties(_proto_, {
            response: {
                get() { return this._response_ || _ori_response_.call(this) }
            },
            responseText: {
                get() { return this._responseText_ || _ori_responseText_.call(this) }
            }
        });

        _w.fetch = async function () {
            const ori = _ori_fetch_.apply(this, arguments);
            const url = arguments[0];
            const matched = getMatched(url);
            if (matched.length === 0) return ori;
            const response = await ori;
            let json = response.json();
            for (const handlers of matched) {
                for (const handler of handlers) {
                    json = await handler(json);
                }
            }
            return new Response(JSON.stringify(json), response);
        }

        return {
            register(url, handler) {
                if (filters.has(url)) {
                    filters.get(url).push(handler);
                } else {
                    filters.set(url, [handler]);
                }
            },
            unregister(url, handler) {
                if (filters.has(url)) {
                    const handlers = filters.get(url);
                    handlers.splice(handlers.indexOf(handler), 1);
                }
            },
            util: {
                blobAsJSON(payload) {
                    return (blob, _ = null) => (_ = JSON.parse(blob2textSync(blob)), new Blob([JSON.stringify(payload(_) || _)], { type: mime.json }));
                }
            }
        };
    })(_w_);

    const options = {
        enableDownload(resource) {
            if (resource.type == 6 || resource.type == 9) {
                if (resource.download != 2) {
                    resource.download = 2;
                    resource.tag = "😎";
                }
            }
        }
    };

    XhrFilter.register(apis.queryCourseResources, XhrFilter.util.blobAsJSON(json =>
        json.data.forEach(options.enableDownload)
    ));
    XhrFilter.register(apis.queryResource, XhrFilter.util.blobAsJSON(options.enableDownload));
})(unsafeWindow || window);