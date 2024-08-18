let lifts = [];
let q = [];
let activeRequests = {};  // Track active lift requests per floor and direction
let input_floors = document.getElementById("input-floors");
let input_lifts = document.getElementById("input-lifts");
let no_of_floors;
let no_of_lifts;
let intervalId;

let form = document.getElementById("form");
form.addEventListener("click", function (e) {
    e.preventDefault();
});

function createLifts(n) {
    lifts = [];
    for (let i = 1; i <= n; i++) {
        let lift = document.createElement("div");
        lift.className = "lift";
        lift.id = "l" + i;
        let left_door = document.createElement("div");
        let right_door = document.createElement("div");
        left_door.classList.add("lift__door", "lift__door-left");
        right_door.classList.add("lift__door", "lift__door-right");
        left_door.id = "ld" + i;
        right_door.id = "rd" + i;
        lift.style.left = `${10 + 15 * i}%`;
        lift.appendChild(left_door);
        lift.appendChild(right_door);
        let liftObj = {
            id: i,
            lift: lift,
            currentFloor: 1,
            moving: false,
        };
        lifts.push(liftObj);
    }
}

function createFloor(floor_number) {
    let container = document.getElementById("container");

    let new_div = document.createElement("div");
    new_div.className = "floor";
    new_div.id = "floor" + floor_number;

    let new_up_btn = document.createElement("button");
    let up_text = document.createTextNode("U");

    let new_down_btn = document.createElement("button");
    let down_text = document.createTextNode("D");
    let new_br = document.createElement("br");
    let new_span = document.createElement("span");
    let new_floor_text = document.createTextNode(floor_number);
    new_span.appendChild(new_floor_text);
    new_span.className = "floor__number";
    new_up_btn.classList.add("control-btn", "control-btn--up");
    new_down_btn.classList.add("control-btn", "control-btn--down");
    new_up_btn.appendChild(up_text);
    new_up_btn.id = "up" + floor_number;
    new_down_btn.appendChild(down_text);
    new_down_btn.id = "down" + floor_number;

    let newBtnContainer = document.createElement("div");
    newBtnContainer.className = "btnContainer";
    if (floor_number === parseInt(input_floors.value)) {
        new_up_btn.style.opacity = 0;
        new_up_btn.disabled = true;
        new_up_btn.style.cursor = "default";
    }
    if (floor_number === 1) {
        new_down_btn.style.opacity = 0;
        new_down_btn.disabled = true;
        new_down_btn.style.cursor = "default";
    }
    new_div.appendChild(new_up_btn);
    new_div.appendChild(new_br);
    new_div.appendChild(new_down_btn);
    new_div.appendChild(new_span);
    let new_hr = document.createElement("hr");
    new_div.appendChild(new_hr);
    container.insertBefore(new_div, container.childNodes[0]);
}

function closeDoor(e) {
    let target_id = e.target.id;
    let lift_no = target_id[target_id.length - 1];
    let left_door = document.getElementById("ld" + lift_no);
    let right_door = document.getElementById("rd" + lift_no);
    right_door.removeEventListener("webkitTransitionEnd", closeDoor);
    left_door.style.transform = `translateX(0)`;
    right_door.style.transform = `translateX(0)`;
    left_door.style.transition = `all 2.5s ease-out`;
    right_door.style.transition = `all 2.5s ease-out`;
    setTimeout(() => {
        stop_lift(lift_no);
    }, 2500);
}

function stop_lift(lift_no) {
    for (let lft of lifts) {
        if (lft.id == lift_no) {
            lft.moving = false;
        }
    }
}

function doorAnimation(e) {
    let target_id = e.target.id;
    let lift_no = target_id[target_id.length - 1];
    let lift = document.getElementById("l" + lift_no);
    lift.removeEventListener("webkitTransitionEnd", doorAnimation);
    let left_door = document.getElementById("ld" + lift_no);
    let right_door = document.getElementById("rd" + lift_no);
    left_door.removeEventListener("webkitTransitionEnd", doorAnimation);
    right_door.removeEventListener("webkitTransitionEnd", doorAnimation);
    right_door.addEventListener("webkitTransitionEnd", closeDoor);
    left_door.style.transform = `translateX(-100%)`;
    right_door.style.transform = `translateX(100%)`;
    left_door.style.transition = `all 2.5s ease-out`;
    right_door.style.transition = `all 2.5s ease-out`;
}

function scheduledLift(floor, direction) {
    let selected_lift;
    let min_distance = Infinity;

    for (let lift of lifts) {
        // Check if the lift is already on the requested floor and not moving
        if (lift.currentFloor === floor && !lift.moving) {
            return lift; // Return the lift that is already on the requested floor
        }

        // Find the closest available lift that is not moving and has no active requests
        if (
            !lift.moving &&
            Math.abs(floor - lift.currentFloor) < min_distance &&
            !(activeRequests[floor] && activeRequests[floor][direction])
        ) {
            min_distance = Math.abs(floor - lift.currentFloor);
            selected_lift = lift;
        }
    }
    return selected_lift;
}

function moveLift(lift, to, direction) {
    let distance = -1 * (to - 1) * 100;
    let lift_no = lift.id;
    let from = lift.currentFloor;
    lift.currentFloor = to;
    lift.moving = true;
    let lft = lift.lift;
    lft.addEventListener("webkitTransitionEnd", doorAnimation);
    lft.style.transform = `translateY(${distance}%)`;
    let time = 2 * Math.abs(from - to);
    if (time === 0) {
        let e = {};
        e.target = {};
        e.target.id = `l${lift_no}`;
        doorAnimation(e);
    }
    lft.style.transitionDuration = `${time}s`;

    // Register the active request to prevent multiple lifts being scheduled
    if (!activeRequests[to]) {
        activeRequests[to] = {};
    }
    activeRequests[to][direction] = true;

    setTimeout(() => {
        // Free the lift after it has moved and doors have closed
        activeRequests[to][direction] = false;
    }, time * 1000 + 2500);

    console.log(
        `Lift Number: ${lift_no} \n Floor: \n From: ${from} To: ${to} \n Time: ${time} sec`
    );
}

function save_click(e) {
    let clicked_on = e.target.id;
    let n;
    let direction;

    if (clicked_on.startsWith("up")) {
        n = Number(clicked_on.substring(2, clicked_on.length));
        direction = "up";
    } else if (clicked_on.startsWith("down")) {
        n = Number(clicked_on.substring(4, clicked_on.length));
        direction = "down";
    }

    // Check if there's already a lift on this floor that's not moving
    let existingLift = lifts.find(
        (lift) => lift.currentFloor === n && !lift.moving
    );

    if (existingLift) {
        // Trigger the door opening animation directly for the lift on this floor
        let event = { target: { id: `l${existingLift.id}` } };
        doorAnimation(event);
    } else {
        // If no lift is already present, add the request to the queue
        if (!(activeRequests[n] && activeRequests[n][direction])) {
            q.push({ floor: n, direction: direction });
        }
    }
}
function getButtons() {
    let up_btn_list = document.getElementsByClassName("control-btn--up");
    let down_btn_list = document.getElementsByClassName("control-btn--down");
    for (let up_btn of up_btn_list) {
        up_btn.addEventListener("click", save_click);
    }
    for (let down_btn of down_btn_list) {
        down_btn.addEventListener("click", save_click);
    }
}

function make_lifts() {
    no_of_lifts = input_lifts.value;
    createLifts(no_of_lifts);
    for (let lft of lifts) {
        let lift = lft.lift;
        lift.style.transform = null;
        lift.style.transitionDuration = null;
    }
}

function make_floors() {
    container.innerHTML = "";
    no_of_floors = input_floors.value;

    for (let i = 1; i <= no_of_floors; i++) {
        createFloor(i);
    }
}

function place_lifts() {
    let first_floor = document.getElementById("floor1");
    for (let i = lifts.length - 1; i >= 0; i--) {
        first_floor.insertBefore(
            lifts[i].lift,
            first_floor.childNodes[first_floor.childNodes.length - 1]
        );
    }
}

function check_for_scheduling() {
    if (q.length === 0) return;
    let request = q.shift();
    let floor = request.floor;
    let direction = request.direction;
    let lift = scheduledLift(floor, direction);
    if (!lift) {
        q.unshift(request);
        return;
    }
    moveLift(lift, floor, direction);
}

function start() {
    if (input_lifts.value <= 0) {
        alert("Number of lifts should be a number above 1");
        document.getElementById("input-lifts").value = 0;
        return;
    }
    if (input_floors.value <= 0) {
        alert("Number of floors should be a number above 1");
        document.getElementById("input-floors").value = 0;
        return;
    }
    clearInterval(intervalId);
    q = [];
    lifts = [];
    activeRequests = {};
    make_floors();
    make_lifts();
    place_lifts();
    getButtons();
    intervalId = setInterval(check_for_scheduling, 100);
}

let input_btn = document.getElementById("input-btn");
input_btn.addEventListener("click", start);
