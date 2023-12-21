const duration = 1000;
const vertical = 180;
const horizon = 180;
const getCord = (evt, mode) => {
    if (mode === MODE.TOUCH) evt = evt.touches[0];
    return { x: evt.clientX, y: evt.clientY };
};
const faceIndex = [
//.   0  1  2  3  X
/*0*/[0, 2, 1, 4],
/*1*/[3, 3, 3, 3],
/*2*/[1, 4, 0, 2],
/*3*/[5, 5, 5, 5],
/*Y*/[],
];
const names = {
    0: "front",
    1: "back",
    2: "left",
    3: "top",
    4: "right",
    5: "bottom"
};
function getFace(x, y) {
    // console.log("x轴翻转：", y == 0);
    // console.log("y轴翻转：", y == 3);
    return names[faceIndex[y][x]];
}

$(window).on("load", function () {
    let startX, startY;
    const main = $(".cube-wrapper");
    const cube = main.query(".cube");
    const ctlr = main.query(".cube-controller");
    const disp = main.query(".disp");
    const opac = main.query("#opacity");
    disp.text(Number(opac.pure.value).toFixed(2));
    ctlr
        .on("mousedown touchstart", onStart)
        .on("mousemove touchmove", evt => mode !== MODE.NONE && onMove(evt))
        .on("mouseup   touchend", onEnd);
    opac
        .on("input", evt => {
            const value = evt.target.value;
            cube.css("--alpha", value);
            disp.text(Number(value).toFixed(2));
        });
    const ANIME = animater(cube.pure);
    const UpNDown = ANIME
        .property("rotateX", { from: -vertical, to: vertical })
        .group({ circle: true, value: 0.375, duration });
    const LeftNRight = ANIME
        .property("rotateY", { from: -horizon, to: horizon })
        .group({ circle: true, value: 0.625, duration });
    ANIME.proxy(props => {
        const x = UpNDown.get("rotateX");
        const y = LeftNRight.get("rotateY");
        cube.css("--rotate-x", `${x}deg`)
            .css("--rotate-y", `${y}deg`);
    });
    let mode = MODE.NONE;
    function onStart(evt) {
        if (mode === MODE.NONE) mode = MODE.GET(evt);
        else return;
        ({ x: startX, y: startY } = getCord(evt, mode));
        LeftNRight.store();
        UpNDown.store();
    }
    function onMove(evt) {
        if (mode !== MODE.GET(evt)) return;
        evt.preventDefault();
        const { x, y } = getCord(evt, mode);
        LeftNRight.go((x - startX) / 300);
        UpNDown.go((startY - y) / 100);
    }
    function onEnd(evt) {
        if (mode !== MODE.GET(evt)) return;
        mode = MODE.NONE;
        const ptX = (Math.round(4 * getFixed(LeftNRight.get("rotateY") / 360 + 0.5)) % 4) / 4;
        const ptY = (Math.round(4 * getFixed(UpNDown.get("rotateX") / 360 + 0.5)) % 4) / 4;
        LeftNRight.unstore().go(ptX);
        UpNDown.unstore().go(ptY);
        let face = getFace(4 * ptX, 4 * ptY);
    }
    UpNDown.reset();
    LeftNRight.reset();
});