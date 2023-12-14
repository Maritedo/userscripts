const routes = ["home", "about", "help"];
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
    document.title = id;
    load_content(id);
    window.history.pushState({ id }, `${id}`, `#${id}`);
}

window.onload = () => {
    document.querySelector(".navigator").addEventListener("click", event => {
        event.preventDefault();
        if (event.target.tagName == "A") _push_(event.target.getAttribute("to"))
    })
    if (window.location.hash !== "") _push_(window.location.hash.slice(1));
    else _push_("home")
}

window.addEventListener("popstate", event => {
    let stateId = event.currentTarget.location.hash.slice(1);
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
    card;

    constructor(ele) {
        this.card = ele;
    }

    init() {
        this.card.addEventListener("mousemove", event => this.handleMouseMove(event));
        this.card.addEventListener("mouseleave", event => this.handleMouseLeave(event));
        this.animateRotation(0, 0, 0, 0, this.card);
        return this;
    }

    handleMouseMove(event) {
        cancelAnimationFrame(this.animationFrameId);

        if (this.card) {
            const boundingRect = this.card.getBoundingClientRect();
            const offsetX = boundingRect.width / 2 - (event.clientX - boundingRect.left);
            const offsetY = boundingRect.height / 2 - (event.clientY - boundingRect.top);

            const targetRotateX = - offsetY / 12;
            const targetRotateY = offsetX / 12;

            const targetShadowX = (offsetX / boundingRect.width) * 30; // 调整阴影水平位置
            const targetShadowY = (offsetY / boundingRect.height) * 30; // 调整阴影垂直位置

            this.animateRotation(targetRotateX, targetRotateY, targetShadowX, targetShadowY);
        }
    }

    animateRotation(targetRotateX, targetRotateY, targetShadowX, targetShadowY) {
        const easeFactor = 0.05;

        function animate(card_animater) {
            const deltaRotateX = (targetRotateX - card_animater.currentRotateX) * easeFactor;
            const deltaRotateY = (targetRotateY - card_animater.currentRotateY) * easeFactor;
            const deltaShadowX = (targetShadowX - card_animater.currentShadowX) * easeFactor;
            const deltaShadowY = (targetShadowY - card_animater.currentShadowY) * easeFactor;

            card_animater.currentRotateX += deltaRotateX;
            card_animater.currentRotateY += deltaRotateY;
            card_animater.currentShadowX += deltaShadowX;
            card_animater.currentShadowY += deltaShadowY;

            card_animater.card.style.transform = `rotateX(${card_animater.currentRotateX}deg) rotateY(${card_animater.currentRotateY}deg)`;

            card_animater.card.style.boxShadow = `${card_animater.currentShadowX}px ${card_animater.currentShadowY}px 20px -10px rgba(0, 0, 0, 0.6)`;

            //, inset ${card_animater.currentShadowX / 4}px ${card_animater.currentShadowY / 4}px 8px -4px rgba(0, 0, 0, 0.6)

            if (Math.abs(Math.min(card_animater.currentRotateX, card_animater.currentRotateY, card_animater.currentShadowX, card_animater.currentShadowY)) > 0.1) {
                card_animater.animationFrameId = requestAnimationFrame(() => animate(card_animater));
            } else {

            }
        }

        animate(this);
    }

    handleMouseLeave(event) {
        cancelAnimationFrame(this.animationFrameId);

        if (this.card) {
            this.animateRotation(0, 0, 0, 0, this.card);
        }
    }
}

const animaters = [];
document.querySelectorAll(".card").forEach(element => {
    animaters.push((new cardAnimater(element)).init());
});