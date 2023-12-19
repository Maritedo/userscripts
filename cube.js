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
    const AxisX = ANIME
        .property("rotateX", {
            from: -180,
            to: 180
        })
        .group({ circle: true, value: 0.5 });
    const AxisY = ANIME
        .property("rotateY", {
            from: -180,
            to: 180
        })
        .group({ circle: true, value: 0.5 });
    ANIME.proxy(props => {
        const x = AxisX.get("rotateX");
        const y = AxisY.get("rotateY");
        cube
            .css("--rotate-x", `${x}deg`)
            .css("--rotate-y", `${y}deg`);

    });
    function onStart(evt) {
        lock = false;
        const { x, y } = getCord(evt);
        startX = x;
        startY = y;
    }
    function onMove(evt) {
        const { x, y } = getCord(evt);
        AxisX.go(((100 - y) % 100) / 100);
        AxisY.go(((100 - x) % 100) / 100);
    }
    function onEnd(evt) {
        lock = true;
        const { x, y } = getCord(evt);
    }
});
const getCord = (evt) => {
    return { x: evt.offsetX, y: evt.offsetY };
}