const duration = 300;

$(window).on("load", function () {
    let lock = true;
    let startX, startY;
    const main = $(".wrapper");
    const cube = main.query(".cube");
    main
        .on("mousedown", onStart)
        .on("mousemove", evt => !lock && onMove(evt))
        .on("mouseup", onEnd);
    const ANIME = animater(cube.pure);
    const UpNDown = ANIME
        .property("rotateX", { from: -60, to: 60 })
        .group({ value: 0.25, duration });
    const LeftNRight = ANIME
        .property("rotateY", { from: -180, to: 180 })
        .group({ circle: true, value: 0.125, duration });
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
        const { x, y } = getCord(evt);
        LeftNRight.go((x - startX) / 300);
        UpNDown.go((startY - y) / 300);
    }
    function onEnd(evt) {
        lock = true;
        LeftNRight.unstore();
        UpNDown.unstore();
    }
});
const getCord = (evt) => {
    return { x: evt.offsetX, y: evt.offsetY };
}