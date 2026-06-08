// KaiOS input for ClassiCube – movement keys + direct camera angle control
// Works without pointer lock or synthetic mouse events.

const KEY_MAP = {
    'ArrowUp':    { key: 'w', code: 'KeyW', keyCode: 87 },
    'Up':         { key: 'w', code: 'KeyW', keyCode: 87 },
    'ArrowDown':  { key: 's', code: 'KeyS', keyCode: 83 },
    'Down':       { key: 's', code: 'KeyS', keyCode: 83 },
    'ArrowLeft':  { key: 'a', code: 'KeyA', keyCode: 65 },
    'Left':       { key: 'a', code: 'KeyA', keyCode: 65 },
    'ArrowRight': { key: 'd', code: 'KeyD', keyCode: 68 },
    'Right':      { key: 'd', code: 'KeyD', keyCode: 68 },
    'Enter':      { key: ' ', code: 'Space', keyCode: 32 },
    'Backspace':  { key: 'Escape', code: 'Escape', keyCode: 27 }
};

let lookState = { left: false, right: false, up: false, down: false };
const LOOK_SPEED = 2.5; // degrees per frame (60fps ≈ 150°/sec)

// Wait for Module and HEAPF32 to be ready
function waitForGame() {
    if (typeof Module !== 'undefined' && Module.HEAPF32) {
        startLookLoop();
    } else {
        setTimeout(waitForGame, 100);
    }
}

function startLookLoop() {
    function updateCamera() {
        if (!Module.HEAPF32) return;
        let yaw = Module.HEAPF32[439870];
        let pitch = Module.HEAPF32[439869];

        if (lookState.left)  yaw -= LOOK_SPEED;
        if (lookState.right) yaw += LOOK_SPEED;
        if (lookState.up)    pitch -= LOOK_SPEED;
        if (lookState.down)  pitch += LOOK_SPEED;

        // Normalize yaw (0..360)
        yaw = ((yaw % 360) + 360) % 360;
        // Clamp pitch to -90..90
        pitch = Math.min(90, Math.max(-90, pitch));

        Module.HEAPF32[439870] = yaw;
        Module.HEAPF32[439869] = pitch;
    }

    function loop() {
        updateCamera();
        requestAnimationFrame(loop);
    }
    loop();
}

window.addEventListener('keydown', function(e) {
    let mapped = KEY_MAP[e.key];
    if (mapped) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat) triggerKeyEvent('keydown', mapped);
        return;
    }

    switch(e.key) {
        case '2': e.preventDefault(); e.stopImmediatePropagation(); lookState.down = false; lookState.up = true; break;
        case '8': e.preventDefault(); e.stopImmediatePropagation(); lookState.up = false; lookState.down = true; break;
        case '4': e.preventDefault(); e.stopImmediatePropagation(); lookState.right = false; lookState.left = true; break;
        case '6': e.preventDefault(); e.stopImmediatePropagation(); lookState.left = false; lookState.right = true; break;
        case '5':
            e.preventDefault();
            e.stopImmediatePropagation();
            if (!e.repeat) {
                simulateMouseButton('mousedown', 0);
                simulateMouseButton('mouseup', 0);
                simulateMouseButton('click', 0);
            }
            break;
        case '9':
            e.preventDefault();
            e.stopImmediatePropagation();
            if (!e.repeat) {
                simulateMouseButton('mousedown', 2);
                simulateMouseButton('mouseup', 2);
                simulateMouseButton('click', 2);
            }
            break;
    }
}, true);

window.addEventListener('keyup', function(e) {
    let mapped = KEY_MAP[e.key];
    if (mapped) {
        e.preventDefault();
        e.stopImmediatePropagation();
        triggerKeyEvent('keyup', mapped);
        return;
    }

    switch(e.key) {
        case '2': lookState.up = false; break;
        case '8': lookState.down = false; break;
        case '4': lookState.left = false; break;
        case '6': lookState.right = false; break;
    }
}, true);

function triggerKeyEvent(type, mappedKey) {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    let event;
    try {
        event = document.createEvent('KeyboardEvent');
        if (event.initKeyEvent) {
            event.initKeyEvent(type, true, true, window, false, false, false, false, mappedKey.keyCode, 0);
        } else {
            throw new Error('fallback');
        }
    } catch(e) {
        event = new KeyboardEvent(type, { bubbles: true, cancelable: true, key: mappedKey.key, code: mappedKey.code });
        try { Object.defineProperty(event, 'keyCode', { value: mappedKey.keyCode }); } catch(err) {}
    }
    canvas.dispatchEvent(event);
}

function simulateMouseButton(type, button) {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    let event;
    try {
        event = new MouseEvent(type, { bubbles: true, cancelable: true, button: button });
    } catch(e) {
        event = document.createEvent('MouseEvents');
        event.initMouseEvent(type, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, button, null);
    }
    canvas.dispatchEvent(event);
}

// Focus canvas on page load
window.addEventListener('load', function() {
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.focus();
    waitForGame();
});
