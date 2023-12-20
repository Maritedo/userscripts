const duration = 1000;
const vertical = 90;
const horizon = 180;
const getCord = (evt, mode) => {
    if (mode === MODE.TOUCH) evt = evt.touches[0];
    return { x: evt.clientX, y: evt.clientY };
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
        .group({ value: 0.375, duration });
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
        LeftNRight.unstore();
        UpNDown.unstore();
        UpNDown.reset();
    }
    UpNDown.reset();
    LeftNRight.reset();
});