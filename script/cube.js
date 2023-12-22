import "./lib.js";
import "./animater.js"

const duration = 3000;
const sensitivity = 400;
const getCord = (evt, ele, mode) => {
    if (mode === MODE.TOUCH) evt = evt.touches[0];
    const box = ele.getBoundingClientRect();
    return { x: evt.clientX - box.left, y: evt.clientY - box.top };
};
const faceIndex = [
//.   0  1  2  3  X
/*0*/[0, 2, 1, 4],
/*1*/[3, 3, 3, 3],
/*2*/[1, 4, 0, 2],
/*3*/[5, 5, 5, 5],
/*Y*/];
const names = {
    0: "front",
    1: "back",
    2: "bottom",
    3: "left",
    4: "top",
    5: "right"
};
let cube;
function getFace(x, y) {
    return names[faceIndex[y][x]];
}

// $(window).on("load", function () {
//     let startX, startY;
//     let startH = 0, startV = 0;
//     let initial = Multiple(genHRotate(startH), genVRotate(startV));
//     let mode = MODE.NONE;
//     let accumulatedX = 0;
//     let accumulatedY = 0;
//     const main = $(".cube-wrapper");
//     cube = main.query(".cube");
//     const ctlr = main.query(".cube-controller");
//     const disp = main.query(".disp");
//     const opac = main.query("#opacity");
//     disp.text(Number(opac.pure.value).toFixed(2));
//     ctlr
//         .on("mousedown  touchstart", onStart)
//         .on("mousemove  touchmove", evt => mode !== MODE.NONE && onMove(evt))
//         .on("mouseleave touchend mouseup", onEnd);
//     opac
//         .on("input", evt => {
//             const value = evt.target.value;
//             cube.css("--alpha", value);
//             disp.text(Number(value).toFixed(2));
//         });
//     const ANIME = animater(cube.pure);
//     const AxisH = ANIME
//         .property("rotate", { from: 0, to: 2 * Math.PI })
//         .group({ circle: true, value: startH, duration });
//     const AxisV = ANIME
//         .property("rotate", { from: 0, to: 2 * Math.PI })
//         .group({ circle: true, value: startV, duration });
//     const startUp = () => {
//         console.log("START");
//         startH = AxisH.store().calc("rotate", AxisH.meta.states.current);
//         startV = AxisV.store().calc("rotate", AxisV.meta.states.current);
//         initial = Multiple(genHRotate(startH), genVRotate(startV));
//     }
//     const payload = () => {
//         const h = AxisH.get("rotate");
//         const v = AxisV.get("rotate");
//         const delta = Multiple(genHRotate(h - startH), genVRotate(v - startV));
//         setRotation(Multiple(initial, delta));
//     }
//     const cleanUp = () => {
//         accumulatedX = accumulatedY = 0;
//         const h = AxisH.get("rotate");
//         const v = AxisV.get("rotate");
//         const delta = Multiple(genHRotate(h - startH), genVRotate(v - startV));
//         initial = Multiple(initial, delta);
//     }
//     function getAxisState() {
//         const ptH = Math.round(4 * getFixed(AxisH.get("rotate") / 2 / Math.PI)) % 4;
//         const ptV = Math.round(4 * getFixed(AxisV.get("rotate") / 2 / Math.PI)) % 4;
//         return {
//             h: ptH / 4,
//             v: ptV / 4
//         }
//     }

//     payload();
//     ANIME.onInvoke(startUp).proxy(payload).onEnd(cleanUp);

//     function onStart(evt) {
//         if (mode === MODE.NONE) mode = MODE.GET(evt);
//         else return;
//         ({ x: startX, y: startY } = getCord(evt, ctlr.pure, mode));
//         AxisH.store();
//         AxisV.store();
//     }
//     function onMove(evt) {
//         if (mode !== MODE.GET(evt)) return;
//         evt.preventDefault();
//         const { x, y } = getCord(evt, ctlr.pure, mode);
//         AxisH.go((startY - y + accumulatedY) / sensitivity);
//         AxisV.go((x - startX + accumulatedX) / sensitivity);
//     }
//     function onEnd(evt) {
//         if (mode !== MODE.GET(evt)) return;
//         mode = MODE.NONE;
//         const { x, y } = getCord(evt, ctlr.pure, mode);
//         accumulatedX += x - startX;
//         accumulatedY += startY - y;
//         const { h, v } = getAxisState();
//         AxisH.unstore().go(h);
//         AxisV.unstore().go(v);
//     }
// });
$(window).on("load", function () {
    let flag = true;
    let initial = genRotate(0, 0);
    let mode = MODE.NONE;
    let startX, startY;
    let accumulatedX = 0, accumulatedY = 0;
    const main = $(".cube-wrapper");
    cube = main.query(".cube");
    const ctlr = main.query(".cube-controller");
    const disp = main.query(".disp");
    const opac = main.query("#opacity");
    disp.text(Number(opac.pure.value).toFixed(2));
    ctlr
        .on("mousedown  touchstart", evt => {
            if (mode === MODE.NONE) mode = MODE.GET(evt);
            else return;
            onStart(evt);
        })
        .on("mousemove  touchmove", evt => {
            if (mode === MODE.NONE || mode !== MODE.GET(evt)) return;
            evt.preventDefault();
            onMove(evt);
        })
        .on("mouseleave touchend mouseup", evt => {
            if (mode !== MODE.GET(evt)) return;
            mode = MODE.NONE;
            onEnd(evt);
        });
    opac
        .on("input", evt => {
            const value = evt.target.value;
            cube.css("--alpha", value);
            disp.text(Number(value).toFixed(2));
        });
    const ANIME = animater(cube.pure);
    const AxisH = ANIME
        .property("rotate", { from: 0, to: 2 * Math.PI })
        .group({ circle: true, value: 0, duration });
    const AxisV = ANIME
        .property("rotate", { from: 0, to: 2 * Math.PI })
        .group({ circle: true, value: 0, duration });
    const payload = () => {
        const h = AxisH.get("rotate");
        const v = AxisV.get("rotate");
        setRotation(Multiple(initial, genRotate(h, v)));
    }
    function getAxisState() {
        const ptH = Math.round(4 * getFixed(AxisH.get("rotate") / 2 / Math.PI)) % 4;
        const ptV = Math.round(4 * getFixed(AxisV.get("rotate") / 2 / Math.PI)) % 4;
        return {
            h: ptH / 4,
            v: ptV / 4
        }
    }

    payload();
    ANIME.proxy(payload);

    function onStart(evt) {
        ({ x: startX, y: startY } = getCord(evt, ctlr.pure, mode));
        const h = AxisH.get("rotate");
        const v = AxisV.get("rotate");
        AxisH.set(0, true).store();
        AxisV.set(0, true).store();
        initial = Multiple(initial, genRotate(h, v));
    }
    function onMove(evt) {
        const { x, y } = getCord(evt, ctlr.pure, mode);
        AxisH.go((startY - y) / sensitivity);
        AxisV.go((x - startX) / sensitivity);
    }
    function onEnd(evt) {

    }
});

function Multiple(p, q) {
    const [a, b, c, d] = p;
    const [t, x, y, z] = q;
    return [
        a * t - b * x - c * y - d * z,
        b * t + a * x + d * y - c * z,
        c * t - d * x + a * y + b * z,
        d * t + c * x - b * y + a * z
    ];
}

function genHRotate(angle) {
    const COS = Math.cos(angle / 2);
    const SIN = Math.sin(angle / 2);
    return [COS, SIN, 0, 0];
}

function genVRotate(angle) {
    const COS = Math.cos(angle / 2);
    const SIN = Math.sin(angle / 2);
    return [COS, 0, SIN, 0];
}

function genRotate(angleH, angleV) {
    return Multiple(genHRotate(angleH), genVRotate(angleV));
}

function setRotation(p) {
    const [a, b, c, d] = p;
    cube.css("--angle", `${round(Math.acos(a) * 2)}rad`);
    let vlen = Math.sqrt(b ** 2 + c ** 2 + d ** 2);
    if (vlen == 0)
        cube.css("--axis-x", 0)
            .css("--axis-y", 0)
            .css("--axis-z", 0);
    else
        cube.css("--axis-x", round(b / vlen))
            .css("--axis-y", round(c / vlen))
            .css("--axis-z", round(d / vlen));
}

function round(num) {
    const factor = 100000;
    return Math.round(num * factor) / factor;
}


// mousedown
// WAIT mousemove
//     => startUp => payload
// REPEAT => mousemove => (payload --> payload) => cleanUp -> mouseup -> END || mouseup => (payload -> payload) => cleanUp => END