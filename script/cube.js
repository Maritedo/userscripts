const duration = 1000;
const vertical = 90;
const horizon = 180;

$(window).on("load", function () {
    let lock = true;
    let startX, startY;
    const main = $(".wrapper");
    const cube = main.query(".cube");
    main
        .on("mousedown touchstart", onStart)
        .on("mousemove touchmove", evt => !lock && onMove(evt))
        .on("mouseup   touchend", onEnd);
    const ANIME = animater(cube.pure);
    const UpNDown = ANIME
        .property("rotateX", { from: -vertical, to: vertical })
        .group({ value: 0.25, duration });
    const LeftNRight = ANIME
        .property("rotateY", { from: -horizon, to: horizon })
        .group({ circle: true, value: 0.625, duration });
    ANIME.proxy(props => {
        const x = UpNDown.get("rotateX");
        const y = LeftNRight.get("rotateY");
        cube.css("--rotate-x", `${x}deg`)
            .css("--rotate-y", `${y}deg`);
    });
    function onStart(evt) {
        lock = false;
        ({ x: startX, y: startY } = getCord(evt));
        LeftNRight.store();
        UpNDown.store();
    }
    function onMove(evt) {
        evt.preventDefault();
        const { x, y } = getCord(evt);
        LeftNRight.go((x - startX) / 300);
        UpNDown.go((startY - y) / 100);
    }
    function onEnd(evt) {
        lock = true;
        LeftNRight.unstore();
        UpNDown.unstore();
    }
    UpNDown.reset();
    LeftNRight.reset();
});
const getCord = (evt) => {
    if(evt.type.indexOf("touch") >= 0) {
        evt = evt.touches[0];
    }
    return { x: evt.clientX, y: evt.clientY };
}