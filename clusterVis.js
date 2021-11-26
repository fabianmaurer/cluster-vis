positions = []
velocities = []
let can = document.getElementById('clusters');
let w = $(window).width();
let h = $(window).height();
can.width = w;
can.height = h;
let ctx = can.getContext('2d');
let c = 0
let startIndex = 0
let maxElements = 900
dragMult = 0
const inertia = false
const cutoff = 0
const normalize = true
const repell = true
let uniform = false
let distanceScale = 20
let scale = 1
let strokeEnabled = false;
let stop = false;
let distanceMatrix = distanceMatrix_absolute

$(document).ready(function() {
    $('#clusters').bind('mousewheel', function(e) {
        x = e.originalEvent.clientX
        y = e.originalEvent.clientY
        if (e.originalEvent.wheelDelta > 0) {
            console.log(e.originalEvent)
            let zoomfactor = 1.2
            ctx.transform(zoomfactor, 0, 0, zoomfactor, -(zoomfactor - 1) * x, -(zoomfactor - 1) * y)
        } else {
            let zoomfactor = 1 / 1.2
            ctx.transform(zoomfactor, 0, 0, zoomfactor, -(zoomfactor - 1) * x, -(zoomfactor - 1) * y)

        }
    });
});

bindButtons();
init();

function init() {
    stop = false;
    if (uniform) generateUniformState(maxElements)

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

function loadPreset(i) {
    const third = Math.floor(positions.length / 3)
    if (i == 0) {
        startIndex = 0
        maxElements = positions.length
    }
    if (i == 1) {
        startIndex = 0
        maxElements = third
    }
    if (i == 2) {
        startIndex = third
        maxElements = third * 2
    }
    if (i == 3) {
        startIndex = third * 2
        maxElements = third * 3
    }
    init();
}

function generateUniformState(n) {
    for (let i = 0; i < n; i++) {
        distanceMatrix[i] = []
        for (let j = 0; j < n; j++) {
            if (i == j) {
                distanceMatrix[i][j] = 0
            } else {
                distanceMatrix[i][j] = -Math.abs(Math.round(10 + Math.random() * 20))
            }
        }
    }
}

function getRandomXPos() {
    return Math.random() * w * 0.75 + (w / 8)
}

function getRandomYPos() {
    return Math.random() * h * 0.75 + (h / 8)
}

function loop() {
    drawData(strokeEnabled);
    if (!inertia) {
        for (let i = 0; i < positions.length; i++) {
            velocities[i] = [0, 0]
        }
    }
    for (let index = startIndex; index < Math.min(positions.length, maxElements) - 1; index++) {
        calcForce(index)
    }
    if (normalize) {
        normalizeVelocities();
    }
    doStep();
    c++;
    if (!stop) requestAnimationFrame(loop)

}

function calcForce(index, inertia) {
    for (let n = index + 1; n < Math.min(distanceMatrix.length, maxElements); n++) {
        if (n == index) continue;
        targetDist = Math.max(0.2, Math.abs(distanceMatrix[n][index])) * distanceScale
        xDist = positions[index][0] - positions[n][0]
        yDist = positions[index][1] - positions[n][1]
        actualDist = dist(positions[index][0], positions[index][1], positions[n][0], positions[n][1])
        totalForce = (actualDist - targetDist) * Math.abs(actualDist - targetDist) / 100
            // neutralize repelling forces
        if (!repell && (actualDist < targetDist)) totalForce *= 0;
        // if (actualDist < targetDist) {
        //     totalForce *= 0.5
        // }
        xForce = -totalForce * xDist / actualDist
        yForce = -totalForce * yDist / actualDist
        velocities[index][0] += xForce
        velocities[index][1] += yForce
        velocities[n][0] -= xForce
        velocities[n][1] -= yForce
            //debugger
    }
}

function doStep() {

    //debugger;
    for (let n = startIndex; n < Math.min(velocities.length, maxElements); n++) {
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
    total = Math.max(Math.pow(maxElements, 1.3), total)

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
    for (let i = startIndex; i < Math.min(positions.length, maxElements); i++) {
        ctx.beginPath();
        ctx.moveTo(positions[i][0], positions[i][1])
        ctx.arc(positions[i][0], positions[i][1], 4, 0, Math.PI * 2)
            //ctx.fillStyle = i < third ? "#a00" : i < third * 2 ? '#0a0' : '#00a';
        if (i < third) {
            ctx.fillStyle = "rgba(250,50,50,0.5)"
        } else if (i < third * 2) {
            ctx.fillStyle = "rgba(50,250,50,0.5)"
        } else {
            ctx.fillStyle = "rgba(50,50,250,0.5)"
        }
        //ctx.fillStyle = "rgba(" + i < third ? 150 : 0 + "," + i < third * 2 ? 150 : 0 + "," + i < third * 3 ? 150 : 0 + ",0.5)"
        ctx.fill()

        //ctx.stroke();
        ctx.closePath()
    }

    tension = 0
    tension_abs = 0
    cnt = 0
    for (let i = startIndex; i < Math.min(positions.length, maxElements) - 1; i++) {
        for (let j = i + 1; j < Math.min(positions.length, maxElements); j++) {
            targetDist = Math.max(0.2, Math.abs(distanceMatrix[i][j])) * distanceScale
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
                ctx.strokeStyle = "rgba(255, 255, 255," + _tension / 200 + " )"
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

function bindButtons() {
    let buttons = $('.buttonbar').children();
    for (let i = 0; i < buttons.length; i++) {
        $(buttons[i]).click(function(e) {
            $('.buttonbar').find('.active').removeClass('active');
            $(e.currentTarget).addClass('active')
            console.log(1)
            stop = true;
            requestAnimationFrame(() => loadPreset(i));
        })
    }
    buttons3 = $('.buttonbar3').children();
    for (let i = 0; i < buttons3.length; i++) {
        $(buttons3[i]).click(function(e) {
            console.log(3)
            $('.buttonbar3').find('.active').removeClass('active');
            $(e.currentTarget).addClass('active')
            if (i == 0) {
                distanceMatrix = distanceMatrix_absolute
            }
            if (i == 1) {
                distanceMatrix = distanceMatrix_deriv
            }
            if (i == 2) {
                distanceMatrix = distanceMatrix_ternary
            }
            stop = true;
            requestAnimationFrame(() => init());
        })
    }
    $('.buttonbar2').children().first().click(function(e) {
        uniform = true;
        $('.buttonbar2').find('.active').removeClass('active');
        $(e.currentTarget).addClass('active')
        requestAnimationFrame(() => init());
    })
    $('.buttonbar2').children().last().click(function(e) {
            uniform = false;
            $('.buttonbar2').find('.active').removeClass('active');
            $(e.currentTarget).addClass('active')
            requestAnimationFrame(() => init());
        })
        // let trails = $('.buttonbar3').children();
        // for (let i = 0; i < trails.length; i++) {
        //     $(trails[i]).click(function (e) {
        //         $('.buttonbar3').find('.active').removeClass('active');
        //         $(e.currentTarget).addClass('active')
        //         trailMode(i);
        //     })
        // }
    $('.buttonbar4').children().first().click(function() {
        $('.buttonbar4').children().first().toggleClass('active');
        strokeEnabled = !strokeEnabled;
    })
}