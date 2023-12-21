const duration = 1000;
const vertical = 180;
const horizon = 180;
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
        .group({ circle: true, value: 0, duration });
    const LeftNRight = ANIME
        .property("rotateY", { from: -horizon, to: horizon })
        .group({ circle: true, value: 0, duration });
    const payload = props => {
        const x = UpNDown.get("rotateX");
        const y = LeftNRight.get("rotateY");
        cube.css("--rotate-x", `${x}deg`)
            .css("--rotate-y", `${y}deg`);
    }
    ANIME.proxy(payload);
    payload();
    let mode = MODE.NONE;
    function getAxisState(reverseAgain = false) {
        const ptX = Math.round(4 * getFixed(LeftNRight.get("rotateY") / 360 + 0.5)) % 4;
        const ptY = Math.round(4 * getFixed(UpNDown.get("rotateX") / 360 + 0.5)) % 4;
        return {
            pt: {
                x: ptX / 4,
                y: ptY / 4
            },
            reverseX: ptY == 0 || (reverseAgain ? (ptY == 3) : (ptY == 1))
        }
    }
    let state;
    function onStart(evt) {
        if (mode === MODE.NONE) mode = MODE.GET(evt);
        else return;
        ({ x: startX, y: startY } = getCord(evt, ctlr.pure, mode));
        state = getAxisState(startY > ctlr.pure.getBoundingClientRect().height / 2);
        LeftNRight.store();
        UpNDown.store();
    }
    const sensitivity = 300;
    function onMove(evt) {
        if (mode !== MODE.GET(evt)) return;
        evt.preventDefault();
        const { x, y } = getCord(evt, ctlr.pure, mode);
        if (state.reverseX)
            LeftNRight.go((startX - x) / sensitivity);
        else
            LeftNRight.go((x - startX) / sensitivity);
        UpNDown.go((startY - y) / sensitivity);
    }
    function onEnd(evt) {
        if (mode !== MODE.GET(evt)) return;
        mode = MODE.NONE;
        let _state_ = getAxisState();
        LeftNRight.unstore().go(_state_.pt.x);
        UpNDown.unstore().go(_state_.pt.y);
    }
});