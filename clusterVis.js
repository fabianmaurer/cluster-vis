positions = []
velocities = []
let can = document.getElementById('clusters');
let w = $(window).width();
let h = $(window).height();
can.width = w;
can.height = h;
let ctx = can.getContext('2d');
let c = 0
const maxElements = 900
scale = 1
dragMult = 0
const inertia = false
const cutoff = 0
const normalize = false


init();
console.log(positions)

function init() {
    positions = new Array(distanceMatrix.length)
    for (let i = 0; i < positions.length; i++) {
        positions[i] = [getRandomXPos(), getRandomYPos()]
        velocities[i] = [0, 0]
    }
    if (!normalize) {
        scale = 0.05 / maxElements
    }
    loop()
}

function getRandomXPos() {
    return Math.random() * w * 0.75 + (w / 8)
}

function getRandomYPos() {
    return Math.random() * h * 0.75 + (h / 8)
}

function loop() {
    drawData(false);
    if (!inertia) {
        for (let i = 0; i < positions.length; i++) {
            velocities[i] = [0, 0]
        }
    }
    for (let index = 0; index < Math.min(positions.length, maxElements) - 1; index++) {
        calcForce(index)
    }
    if (normalize) {
        normalizeVelocities();
    }
    doStep();
    c++;
    requestAnimationFrame(loop)

}

function calcForce(index, inertia) {
    for (let n = index + 1; n < Math.min(distanceMatrix.length, maxElements); n++) {
        if (n == index) continue;
        targetDist = Math.max(0.2, Math.abs(distanceMatrix[n][index])) * 10
        xDist = positions[index][0] - positions[n][0]
        yDist = positions[index][1] - positions[n][1]
        actualDist = dist(positions[index][0], positions[index][1], positions[n][0], positions[n][1])
            // console.log(targetDist)
            // console.log(actualDist)
        totalForce = (actualDist - targetDist) * Math.abs(actualDist - targetDist) / 100
            // if (actualDist < targetDist) {
            //     totalForce *= 0.5
            // }
        xForce = -totalForce * xDist / actualDist
        yForce = -totalForce * yDist / actualDist
        velocities[index][0] += xForce
        velocities[index][1] += yForce
        velocities[n][0] -= xForce
        velocities[n][1] -= yForce
    }
}

function doStep() {
    let section = velocities.slice(0, maxElements).map(i => i.slice(0, maxElements))
    console.log(section)

    debugger;
    for (let n = 0; n < Math.min(velocities.length, maxElements); n++) {
        velocities[n][0] -= drag(velocities[n][0])
        velocities[n][1] -= drag(velocities[n][1])
            // cutoff 
        if (Math.abs(velocities[n][0]) < cutoff) velocities[n][0] = 0
        if (Math.abs(velocities[n][1]) < cutoff) velocities[n][1] = 0

        positions[n][0] += velocities[n][0] * scale
        positions[n][1] += velocities[n][1] * scale
    }
}

function normalizeVelocities() {
    xSum = 0;
    ySum = 0;
    for (let n = 0; n < velocities.length; n++) {
        xSum += Math.abs(velocities[n][0])
        ySum += Math.abs(velocities[n][1])
    }
    total = (xSum + ySum) * 0.0001
    console.log(velocities)
    console.log(total)
    for (let n = 0; n < velocities.length; n++) {
        velocities[n][0] /= total
        velocities[n][1] /= total
    }
}

function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1)
}

function drag(v) {
    //return 0
    return Math.min(dragMult * 0.1 * v, dragMult * 0.02 * Math.pow(v, 2))
}

function drawData(stroke) {
    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = "#000"
    const third = Math.floor(positions.length / 3)
    for (let i = 0; i < Math.min(positions.length, maxElements); i++) {
        ctx.beginPath();
        ctx.moveTo(positions[i][0], positions[i][1])
        ctx.arc(positions[i][0], positions[i][1], 4, 0, Math.PI * 2)
            //ctx.fillStyle = i < third ? "#a00" : i < third * 2 ? '#0a0' : '#00a';
        if (i < third) {
            ctx.fillStyle = "rgba(200,0,0,0.5)"
        } else if (i < third * 2) {
            ctx.fillStyle = "rgba(0,200,0,0.5)"
        } else {
            ctx.fillStyle = "rgba(0,0,200,0.5)"
        }
        //ctx.fillStyle = "rgba(" + i < third ? 150 : 0 + "," + i < third * 2 ? 150 : 0 + "," + i < third * 3 ? 150 : 0 + ",0.5)"
        ctx.fill()

        //ctx.stroke();
        ctx.closePath()
    }

    tension = 0
    tension_abs = 0
    cnt = 0
    for (let i = 0; i < Math.min(positions.length, maxElements) - 1; i++) {
        for (let j = i + 1; j < Math.min(positions.length, maxElements); j++) {
            targetDist = Math.max(0.2, Math.abs(distanceMatrix[i][j])) * 10
            xDist = positions[i][0] - positions[j][0]
            yDist = positions[i][1] - positions[j][1]
            actualDist = dist(positions[i][0], positions[i][1], positions[j][0], positions[j][1])
            totalForce = actualDist - targetDist
            tension_abs += Math.abs(totalForce)
            const _tension = Math.max(actualDist / targetDist, targetDist / actualDist) - 1
            tension += _tension
            cnt++;
            if (stroke) {
                ctx.beginPath();

                const a = Math.sqrt(totalForce / 10000)
                ctx.strokeStyle = "rgba(0, 0, 0," + _tension / 10 + " )"
                ctx.lineWidth = Math.ceil(a * 3)
                ctx.moveTo(positions[i][0], positions[i][1])
                ctx.lineTo(positions[j][0], positions[j][1])

                //ctx.fillText(Math.floor(actualDist) + '/' + targetDist, (positions[i][0] + positions[j][0]) / 2, (positions[i][1] + positions[j][1]) / 2)
                ctx.stroke()
                ctx.closePath()
            }
        }
    }

    tension /= cnt
    tension_abs /= cnt
    $('#tension').html('Avg. tension: ' + Math.round(tension * 100) + '% / absolute: ' + Math.round(tension_abs))



}