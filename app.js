/*
* Blake Clark 2018
* Written in vanilla JS for practice 
*/

(function(){

    // try to avoid declaring variables at 60fps
    const blake = document.querySelector("#employable-hunk");
    const pt = blake.createSVGPoint();
    const anchor = document.querySelector("#anchor");
    const nav = document.querySelector("#navbar");
    const backToTop = document.querySelector(".navbutton.red");
    const topAnchor = backToTop.querySelector("a");
    const sky = document.querySelector("#nightsky"), starCount = 200;
    const eyes = Array.from(document.querySelectorAll(".eyes"));
    const eyelids = document.querySelector("#eyelids");
    const eyeWidth = 10, eyeHeight = 5;
    const isIE = /Edge|MSIE|Trident/.test(window.navigator.userAgent);
    let screenPt, mouseX, mouseY, px = 0, py = 0; 
    let animIsPlaying = true;
    let animationQueue = {}, scrollDuration = 600, scrollTarget;
    
    //// Animation helpers ////
    
    // (re)initialize anchor point for animations
    pt.x = anchor.getAttribute("cx");
    pt.y = anchor.getAttribute("cy");
    const setAnchorScreenCoordinates = function(){
        screenPt = pt.matrixTransform(blake.getScreenCTM());
        return screenPt;
    }

    // schedule animations
    //// animations with parameters should use closures!
    const scheduleAnimation = function(animation){
        if (typeof animation === "function"){
            if (!animationQueue.hasOwnProperty(animation.name)){
                animationQueue[animation.name] = animation;
            }
        }
        if(animationQueue) window.requestAnimationFrame(loop);
    }
    
    // run animations
    //// looping animations should return true
    const loop = function(timestamp){
        if (animationQueue) for (task in animationQueue){
            if (animationQueue[task](timestamp)){
                scheduleAnimation(animationQueue[task])
            } else delete animationQueue[task];
        }
    }
    
    // add animationend with vendor prefixes
    const addAnimationEndListener = function(element, callback){
        const vendorPrefixes = ["webkit", "moz"];
        element.onanimationend = callback;
        vendorPrefixes.forEach((prefix) => {
            element.addEventListener(prefix + "AnimationEnd", callback)
        });
    }

    // RNG
    const random = (min = 0, max) => Math.random() * (max - min) + min;

    ////* JS animations *////

    // calculate and apply eye transform
    const moveEyes = function(e){
        return function eyeStep(){     
            eyes.forEach(eye => {
                if (animIsPlaying) setAnchorScreenCoordinates();
                // always use last known mouse position 
                if (e){     
                    mouseY = e.clientY;
                    mouseX = e.clientX;
                }
                px = (mouseX / window.innerWidth) * eyeWidth - (eyeWidth / 2);
                py = ((mouseY - screenPt.y) / window.innerHeight) * eyeHeight;
                eye.style.transform = `translate(${px}%, ${py}%)`
            });
        }
    }

    // smooth scroll
    const smoothScroll = function(e){
        e.preventDefault();
        let id = e.target.getAttribute("href");
        let target = document.querySelector(id);
        let startPosition = window.pageYOffset;
        let amt, elapsed, startTime = null;
        
        // cap target scroll position at max scrollable position
        let maxScrollY = document.documentElement.scrollHeight - startPosition - window.innerHeight;
        let targetPosition = Math.min(target.getBoundingClientRect().top, maxScrollY);
        
        // allow interruption if target has changed
        if (animationQueue.hasOwnProperty("scrollLoop") && scrollTarget !== id) delete animationQueue.scrollLoop;
        scrollTarget = id;
        target.focus();
        
        return function scrollLoop(time){
            if (startTime === null) startTime = time;
            elapsed = time - startTime;
            amt = easeInOutCubic(elapsed, startPosition, targetPosition, scrollDuration);
            window.scrollTo(0, amt)
            return elapsed < scrollDuration;
        }
    };
    
    // easing function for smooth scroll
    const easeInOutCubic = function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t*t + b;
        t -= 2;
        return c/2*(t*t*t + 2) + b;
    };
    
    // hide Back To Top
    const hideBackToTop = function(isScrolled, button){
        return function setNavButtonStyle(){
            button.style.width = isScrolled ? "100%" : "0%";
            topAnchor.style.color = isScrolled ? "white" : "transparent";
        }
    }
    
    // set event handlers
    blake.onload = window.onresize = setAnchorScreenCoordinates;
    document.onmousemove = e => scheduleAnimation(moveEyes(e));
    addAnimationEndListener(blake, function(e){
        if (animIsPlaying){ 
            animIsPlaying = false;
            setAnchorScreenCoordinates();
        }
        if (e.animationName.includes("blink")) setTimeout(blink, Math.floor(random(4000, 7500)));
        blink();
    });
    Array.from(document.querySelectorAll(".navlink")).forEach(btn => {
        btn.onclick = e => scheduleAnimation(smoothScroll(e));
    });
    window.onscroll = function(){
        setAnchorScreenCoordinates();
        scheduleAnimation(moveEyes(null))
        scheduleAnimation(hideBackToTop(window.pageYOffset > 0, backToTop))
    }
    
    ////* CSS animations *////
    
    // raise brows on navbar hover
    nav.onmouseenter = nav.onmouseleave = () => document.getElementById("brows").classList.toggle("raised");;
    
    // blink
    const blink = function(){ 
        eyelids.classList.toggle(isIE ? "blinkIE" : "blink");
    }
    
    // populate sky with stars
    const populateSky = function(){
        let star, attributes;
        let skyPt = sky.createSVGPoint(), skyScreenPt;
        let [viewBoxWidth, viewBoxHeight] = sky.getAttributeNS(null, "viewBox").match(/\d+/g).map(n => parseInt(n)).slice(2);

        for(let i = 0; i < starCount; i++){
            star = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            attributes = {
                cx: `${random(0, viewBoxWidth)}`,
                cy: `${random(viewBoxHeight/10, viewBoxHeight)}`,
                r: `${random(1, 4)}`,
                fill: "#fff",    
            }
            skyPt.x = attributes.cx;
            skyPt.y = attributes.cy;
            skyScreenPt = skyPt.matrixTransform(sky.getScreenCTM());
            attributes.style = `animation-delay: ${random(0, 5)}s; transform-origin: ${skyScreenPt.x} ${skyScreenPt.y};`;
            for (let key in attributes){
                star.setAttributeNS(null, key, attributes[key]);
            }
            if (!isIE) star.classList.add("star");
            sky.appendChild(star);
        }
    }
    window.onload = populateSky;
})();