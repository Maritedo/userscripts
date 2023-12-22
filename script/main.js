const mapper = new Map([
    ["home", "主页"],
    ["explore", "浏览"],
    ["help", "帮助"]
]);
const routes = Array.from(mapper.keys());
function select_tab(id) {
    $(".route", true)
        .removeClass('selected')
        .filter(`[to="${id}"]`)
        .addClass('selected');
    $(".indicator").css("--before", routes.indexOf(id));
}

function load_content(id) {
    let ele = $("#content");
    $(".page", true, ele.pure).addClass("hidden");
    $(`#page_${id}`, false, ele.pure).removeClass("hidden");
}

function push(event) {
    _push_(event.target.id);
    window.history.pushState({ id }, `${id}`, `#${id}`);
}

function _push_(id) {
    select_tab(id);
    document.title = "UserJS - " + (mapper.get(id) || "Unknown");
    load_content(id);
    window.history.pushState({ id }, `${id}`, `#${id}`);
}

$(window)
    .on("load", event => {
        $(".navigator").on("click", event => {
            event.preventDefault();
            if (event.target.tagName == "A") _push_(event.target.getAttribute("to"))
        });
        if (window.location.hash !== "" && routes.includes(window.location.hash.slice(1))) _push_(window.location.hash.slice(1));
        else _push_("home")
    })
    .on("popstate", event => {
        let stateId = event.currentTarget.location.hash.slice(1);
        stateId = routes.includes(stateId) ? stateId : "home";
        select_tab(stateId);
        load_content(stateId);
        _push_(stateId)
    });

const shadowRange = 20;
const rotateRange = 8;

const getDegree = (x, y) => {
    x -= 0.5;
    y -= 0.5;
    if (x == 0)
        return y > 0 ? 0 : 180;
    else
        return Math.atan(y / x) * 180 / Math.PI + ((x > 0) ? 90 : 270);
};

$(document)
    .on("DOMContentLoaded", e => {
        $(".card").each(element => {
            let mode = MODE.NONE;
            const anim = animater(element.pure)
            const axisX = anim
                .property({ value: 0.5 });
            const axisY = anim
                .property({ value: 0.5 });
            const degree = anim
                .property({ circle: true });
            const opacity = anim
                .property();

            const payload = () => {
                const rx = axisX.value * 2 * rotateRange - rotateRange;
                const ry = axisY.value * 2 * rotateRange - rotateRange;
                const sx = axisX.value * 2 * shadowRange - shadowRange;
                const sy = axisY.value * 2 * shadowRange - shadowRange;
                const dg = degree.value * 360 - 180;
                const op = opacity.value * 0.25;
                element
                    .style("transform", `rotateX(${-rx}deg) rotateY(${ry}deg)`)
                    .style("boxShadow", `${sx}px ${sy}px 14px -7px rgba(0, 0, 0, 0.6)`)
                    .css("--opacity", op)
                    .css("--deg", dg + "deg");
            };
            anim.proxy(payload);
            const reset = () => {
                axisX.reset();
                axisY.reset();
                opacity.reset();
            };
            // const box = refSize(element.pure).box;

            const onStart = (cordX, cordY) => {
                const box = element.pure.getBoundingClientRect();
                const x = (cordX - box.x) / box.width;
                const y = (cordY - box.y) / box.height;

                degree.set(getDegree(x, y) / 360);
            };
            const onMove = (cordX, cordY) => {
                const box = element.pure.getBoundingClientRect();
                const percentX = (cordX - box.x) / box.width;
                const percentY = (cordY - box.y) / box.height;
                const x = percentX - 0.5;
                const y = percentY - 0.5;
                axisX.go(percentX);
                axisY.go(percentY);
                degree.go(getDegree(percentX, percentY) / 360);
                opacity.go(Math.sqrt(4 * (x ** 2 + y ** 2)));
            };
            element
                .on("mouseenter touchstart", event => {
                    if (mode === MODE.NONE) mode = MODE.GET(event);
                    else return;
                    if (event.type === "touchstart") {
                        event.preventDefault();
                        onStart(event.touches[0].clientX, event.touches[0].clientY);
                    }
                    else
                        onStart(event.clientX, event.clientY)
                })
                .on("mousemove  touchmove", event => {
                    if (mode !== MODE.NONE) event.preventDefault();
                    if (mode !== MODE.GET(event)) return;
                    if (event.type === "touchmove") {
                        onMove(event.touches[0].clientX, event.touches[0].clientY);
                    }
                    else
                        onMove(event.clientX, event.clientY)
                })
                .on("mouseleave touchend", event => {
                    if (mode !== MODE.GET(event)) return;
                    mode = MODE.NONE;
                    reset();
                });
            reset();
            payload();
        });
    });