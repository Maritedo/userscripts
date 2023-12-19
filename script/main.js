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

const shadowRange = {
    from: -20,
    to: 20
};
const rotateRange = {
    from: -8,
    to: 8
};

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
            const anim = animater(element.pure)
            const axisX = anim
                .property("rotateX", rotateRange)
                .property("shadowX", shadowRange)
                .group({ value: 0.5 });
            const axisY = anim
                .property("rotateY", rotateRange)
                .property("shadowY", shadowRange)
                .group({ value: 0.5 });
            const degree = anim
                .property("degree", { from: 0, to: 360 })
                .group({ circle: true });
            const opacity = anim
                .property("opacity", { from: 0, to: 0.25 })
                .group();

            const payload = () => {
                const rx = axisX.get("rotateX");
                const ry = axisY.get("rotateY");
                const sx = axisX.get("shadowX");
                const sy = axisY.get("shadowY");
                const dg = degree.get("degree");
                const op = opacity.get("opacity");
                element
                    .style("transform", `rotateX(${-rx}deg) rotateY(${ry}deg)`)
                    .style("boxShadow", `${sx}px ${sy}px 14px -7px rgba(0, 0, 0, 0.6)`)
                    .css("--deg", dg + "deg")
                    .css("--opacity", op);
            };
            anim.proxy(payload);
            const reset = () => {
                axisX.reset();
                axisY.reset();
                opacity.reset();
            };
            // const box = refSize(element.pure).box;
            element
                .on("mouseenter", event => {
                    const box = element.pure.getBoundingClientRect();
                    const x = (event.clientX - box.x) / box.width;
                    const y = (event.clientY - box.y) / box.height;

                    degree.set(getDegree(x, y) / 360);
                })
                .on("mousemove", event => {
                    const box = element.pure.getBoundingClientRect();
                    const percentX = (event.clientX - box.x) / box.width;
                    const percentY = (event.clientY - box.y) / box.height;
                    const x = percentX - 0.5;
                    const y = percentY - 0.5;
                    axisX.go(percentX);
                    axisY.go(percentY);
                    degree.go(getDegree(percentX, percentY) / 360);
                    opacity.go(Math.sqrt(4 * (x ** 2 + y ** 2)));
                })
                .on("mouseleave", event => {
                    reset();
                });

            reset();
            payload();
        });
    });