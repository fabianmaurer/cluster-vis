positions = []
velocities = []
let can = document.getElementById('clusters');
let w = $(window).width();
let h = $(window).height();
can.width = w;
can.height = h;
let ctx = can.getContext('2d');
scale = 0.002

init();
console.log(positions)
loop();

function init() {
    positions = new Array(distanceMatrix.length)
    for (let i = 0; i < positions.length; i++) {
        positions[i] = [getRandomXPos(), getRandomYPos()]
        velocities[i] = [0, 0]
    }
}

function getRandomXPos() {
    return Math.random() * w / 2 + (w / 4)
}

function getRandomYPos() {
    return Math.random() * h / 2 + (h / 4)
}

function loop() {
    for (let index = 0; index < positions.length; index++) {
        calcForce(index)
    }
    doStep();
    drawData();
    requestAnimationFrame(loop)
}

function calcForce(index) {
    for (let n = 0; n < distanceMatrix.length; n++) {
        if (n == index) continue;
        targetDist = Math.max(0.2, Math.abs(distanceMatrix[n][index])) * 10
        xDist = positions[index][0] - positions[n][0]
        yDist = positions[index][1] - positions[n][1]
        actualDist = dist(positions[index][0], positions[index][1], positions[n][0], positions[n][1])
            // console.log(targetDist)
            // console.log(actualDist)
        totalForce = actualDist - targetDist
        xForce = -totalForce * xDist / actualDist
        yForce = -totalForce * yDist / actualDist
        velocities[index][0] += xForce
        velocities[index][1] += yForce
    }
}

function doStep() {
    for (let n = 0; n < velocities.length; n++) {
        velocities[n][0] -= drag(velocities[n][0])
        velocities[n][1] -= drag(velocities[n][1])
            // cutoff at 20
        velocities[n][0] = Math.max(0, velocities[n][0] - 20)
        velocities[n][1] = Math.max(0, velocities[n][1] - 20)
        normalizeVelocities()
        positions[n][0] += velocities[n][0] * scale
        positions[n][1] += velocities[n][1] * scale
    }
}

function normalizeVelocities() {
    xSum = 0;
    ySum = 0;
    for (let n = 0; n < velocities.length; n++) {
        xSum += velocities[n][0]
        ySum += velocities[n][1]
    }
    xSum /= velocities.length
    ySum /= velocities.length
    for (let n = 0; n < velocities.length; n++) {
        velocities[n][0] -= xSum
        velocities[n][1] -= ySum
    }
}

function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1)
}

function drag(v) {
    return Math.min(0.5 * v, 0.1 * Math.pow(v, 2))
}

function drawData() {
    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = "#000"
    for (let i = 0; i < positions.length; i++) {
        ctx.beginPath();
        ctx.moveTo(positions[i][0], positions[i][1])
        ctx.arc(positions[i][0], positions[i][1], 4, 0, Math.PI * 2)
        ctx.fillStyle = i < 30 ? "#a00" : i < 60 ? '#0a0' : '#00a';
        ctx.fill()

        //ctx.stroke();
        ctx.closePath()
    }
}