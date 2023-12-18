const routes = ["home", "about", "help"];
const mapper = new Map([
    ["home", "主页"],
    ["about", "关于"],
    ["help", "帮助"]
]);
function select_tab(id) {
    document.querySelectorAll(".route").forEach(item => item.classList.remove('selected'));
    document.querySelectorAll(".route[to='" + id + "']").forEach(item => item.classList.add('selected'));
    document.querySelector(".indicator").style.setProperty("--before", routes.indexOf(id) + 1);
}

function load_content(id) {
    let ele = document.querySelector("#content");
    ele.querySelectorAll(".page").forEach(element => {
        element.classList.add("hidden");
    });
    if ((ele = ele.querySelector(`#page_${id}`)))
        ele.classList.remove("hidden")
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

window.onload = () => {
    document.querySelector(".navigator").addEventListener("click", event => {
        event.preventDefault();
        if (event.target.tagName == "A") _push_(event.target.getAttribute("to"))
    })
    if (window.location.hash !== "" && routes.includes(window.location.hash.slice(1))) _push_(window.location.hash.slice(1));
    else _push_("home")
}

window.addEventListener("popstate", event => {
    let stateId = event.currentTarget.location.hash.slice(1);
    stateId = routes.includes(stateId) ? stateId : "home";
    select_tab(stateId);
    load_content(stateId);
    _push_(stateId)
});

const shadowRange = 30;
const rotateRange = 8;
$(".card").each(element => {
    const anim = animater(element.pure)
    const axisX = anim
        .property("rotateX", {
            from: -rotateRange,
            to: rotateRange
        })
        .property("shadowX", {
            from: -shadowRange,
            to: shadowRange
        })
        .group({
            value: 0.5
        });
    const axisY = anim
        .property("rotateY", {
            from: -rotateRange,
            to: rotateRange
        })
        .property("shadowY", {
            from: -shadowRange,
            to: shadowRange
        })
        .group({
            value: 0.5
        });
    const degree = anim
        .property("degree", {
            from: 0,
            to: 360
        })
        .group({
            circle: true
        });
    const opacity = anim
        .property("opacity", {
            from: 0,
            to: 0.4
        })
        .group();

    const myProxy = () => {
        const rx = axisX.get("rotateX");
        const ry = axisY.get("rotateY");
        const sx = axisX.get("shadowX");
        const sy = axisY.get("shadowY");
        const dg = degree.get("degree");
        const op = opacity.get("opacity");
        element
            .style("transform", `rotateX(${-rx}deg) rotateY(${ry}deg)`)
            .style("boxShadow", `${sx}px ${sy}px 20px -10px rgba(0, 0, 0, 0.6)`)
            .css("--deg", dg + "deg")
            .css("--opacity", op);
    };
    anim.proxy(myProxy);
    myProxy();
    const reset = () => {
        axisX.reset();
        axisY.reset();
        degree.reset();
        opacity.reset();
    };
    element
        .on("mouseenter touchstart", event => {

        })
        .on("mousemove  touchmove", event => {
            const boundingRect = element.pure.getBoundingClientRect();

            const offsetX = event.clientX - boundingRect.left;
            const offsetY = event.clientY - boundingRect.top;

            const percentX = offsetX / boundingRect.width;
            const percentY = offsetY / boundingRect.height;

            const x = percentX - 0.5;
            const y = percentY - 0.5;

            let deg;
            if (x == 0) {
                deg = y > 0 ? 0 : 180;
            }
            else {
                deg = Math.atan(y / x) * 180 / Math.PI + ((x > 0) ? 90 : 270);
            }

            axisX.go(percentX);
            axisY.go(percentY);
            degree.go(deg / 360);
            opacity.go(keepInside(0, Math.sqrt(4 * (x ** 2 + y ** 2)), 1));
        })
        .on("mouseleave touchend", event => {
            reset();
        });

    reset();
});