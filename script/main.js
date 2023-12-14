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

class cardAnimater {
    animationFrameId;
    currentRotateX = 0;
    currentRotateY = 0;
    currentShadowX = 0;
    currentShadowY = 0;
    currentDeg = 0;
    currentOpacity = 0;
    card;

    constructor(ele) {
        this.card = ele;
    }

    init() {
        this.card.addEventListener("mouseenter", event => this.handleMouseEnter(event));
        this.card.addEventListener("mousemove", event => this.handleMouseMove(event));
        this.card.addEventListener("mouseleave", event => this.handleMouseLeave(event));
        this.animateRotation(0, 0, 0, 0, 0, 0);
        return this;
    }

    handleMouseEnter(event) {
        cancelAnimationFrame(this.animationFrameId);

    }

    handleMouseMove(event) {
        cancelAnimationFrame(this.animationFrameId);

        const rotateRange = 12;
        const shadowRange = 50;

        const boundingRect = this.card.getBoundingClientRect();
        const offsetX = boundingRect.width / 2 - (event.clientX - boundingRect.left);
        const offsetY = boundingRect.height / 2 - (event.clientY - boundingRect.top);

        const percentX = (offsetX * 2 / boundingRect.width);
        const percentY = (offsetY * 2 / boundingRect.height);

        const targetRotateX = - percentX * rotateRange;
        const targetRotateY = percentY * rotateRange;

        const targetShadowX = (offsetX / boundingRect.width) * shadowRange;
        const targetShadowY = (offsetY / boundingRect.height) * shadowRange;

        let deg;
        if (percentX == 0) {
            deg = percentY > 0 ? 0 : 180;
        } else {
            deg = Math.atan(percentY / percentX) * 180 / Math.PI + ((percentX > 0) ? 90 : 270);
        }
        const opacity = Math.sqrt(percentX ** 2 + percentY ** 2);
        this.animateRotation(targetRotateX, targetRotateY, targetShadowX, targetShadowY, opacity, deg);

    }

    handleMouseLeave(event) {
        cancelAnimationFrame(this.animationFrameId);
        this.animateRotation(0, 0, 0, 0, 0, this.currentDeg);
    }

    animateRotation(targetRotateX, targetRotateY, targetShadowX, targetShadowY, targetOpacity, targetDeg) {
        const easeFactor = 0.05;

        function setStyle(card_animater, crx, cry, csx, csy, opacity, deg) {
            card_animater.card.style.transform = `rotateX(${crx}deg) rotateY(${cry}deg)`;
            card_animater.card.style.boxShadow = `${csx}px ${csy}px 20px -10px rgba(0, 0, 0, 0.6)`;
            card_animater.card.style.setProperty("--deg", deg % 360 + "deg");
            card_animater.card.style.setProperty("--opacity", opacity / 4);
        }

        (function animate(card_animater) {
            // 处理角度跃进
            var _deltaDeg = targetDeg - card_animater.currentDeg;
            if (Math.abs(_deltaDeg) > 180) {
                if (targetDeg > 180) {
                    card_animater.currentDeg += 360;
                } else {
                    card_animater.currentDeg -= 360;
                }
            }

            const deltaRotateX = (targetRotateX - card_animater.currentRotateX) * easeFactor;
            const deltaRotateY = (targetRotateY - card_animater.currentRotateY) * easeFactor;
            const deltaShadowX = (targetShadowX - card_animater.currentShadowX) * easeFactor;
            const deltaShadowY = (targetShadowY - card_animater.currentShadowY) * easeFactor;
            const deltaOpacity = (targetOpacity - card_animater.currentOpacity) * easeFactor;
            const deltaDeg = (targetDeg - card_animater.currentDeg) * easeFactor;

            card_animater.currentRotateX += deltaRotateX;
            card_animater.currentRotateY += deltaRotateY;
            card_animater.currentShadowX += deltaShadowX;
            card_animater.currentShadowY += deltaShadowY;
            card_animater.currentOpacity += deltaOpacity;
            card_animater.currentDeg += deltaDeg;

            setStyle(card_animater,
                card_animater.currentRotateX,
                card_animater.currentRotateY,
                card_animater.currentShadowX,
                card_animater.currentShadowY,
                card_animater.currentOpacity,
                card_animater.currentDeg);

            if (Math.abs(Math.min(deltaRotateX, deltaRotateY, deltaShadowX, deltaShadowY)) > 0.1 * easeFactor)
                card_animater.animationFrameId = requestAnimationFrame(() => animate(card_animater));
            else
                setStyle(card_animater,
                    targetRotateX,
                    targetRotateY,
                    targetShadowX,
                    targetShadowY,
                    targetOpacity,
                    targetDeg)
        })(this);
    }
}

const animaters = [];
document.querySelectorAll(".card").forEach(element => {
    animaters.push((new cardAnimater(element)).init());
});