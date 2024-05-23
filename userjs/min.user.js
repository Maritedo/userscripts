// ==UserScript==
// @name         XhrFilter For XY min
// @namespace    666
// @version      0.1.2
// @description
// @author       anonymous
// @match        *://*.ai-augmented.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @connect      ai-augmented.com
// ==/UserScript==

(function(e){function t(e){if(e.readyState<4||e._h)return;e._h=!0;let t=i(e._u);if(0==t.length)return;let r="text"==e.responseType,n=(r?u:l).call(e);for(let e of t)n=e(n);e[r?"_t":"_r"]=n}function r(e){return(t,r=null)=>(r=JSON.parse(function(e){var t=URL.createObjectURL(e),r=new XMLHttpRequest;return r.open("GET",t,!1),r.overrideMimeType(e.type),r.send(),URL.revokeObjectURL(t),r.responseText}(t)),new Blob([JSON.stringify(e(r)||r)],{type:"application/json"}))}function n(e){6!=e.type&&9!=e.type||2!=e.download&&(e.download=2,e.tag="😎")}let o="*://*.ai-augmented.com/api/jx-iresource/resource/query",s=new Map;s.set(o+"CourseResources*",r(e=>e.data.forEach(n))),s.set(o+"Resource*",r(n));let i=e=>Array.from(s.entries()).filter(t=>new RegExp(`^${t[0].replace(/[.+?^${}()|[\]\\]/g,"\\$&").replace(/\*/g,".*")}$`,"i").test(e)).map(e=>e[1]),p=e.XMLHttpRequest.prototype,a=p.open,c=p.send,l=Object.getOwnPropertyDescriptor(p,"response").get,u=Object.getOwnPropertyDescriptor(p,"responseText").get;Object.assign(p,{open(){this._u=arguments[1],a.apply(this,arguments)},send(){for(let e of["onload","onreadystatechange"]){let r=this[e];r instanceof Function&&(this[e]=function(){t(this),r.apply(this,arguments)})}c.apply(this,arguments)}}),Object.defineProperties(p,{response:{get(){return this._r||l.call(this)}},responseText:{get(){return this._t||u.call(this)}}})})(unsafeWindow||window);
