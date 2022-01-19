/**
 * This file contains all functinal code of the cluster and distances visualization tool
 * It can be open by simply opening index.html in a web browser
 * This file is only scarcely commented since it is not the main part of the thesis
 * Nonetheless, here is a brief outline of how this works:
 * 
 * Both functional and visual code is all native javascript aside from jQuery for convenient button mapping
 * HTML5 canvas was used as a display port
 * The screen is redrawn on a per-frame basis and all physics calculations happen once per frame
 * -> higher framerate = faster simulation and convergence
 * data is read from .js files which are included on the CD
 */



positions = []
velocities = []
let can = document.getElementById('clusters');
let w = $(window).width();
let h = $(window).height();
can.width = w;
can.height = h;
let ctx = can.getContext('2d');
ctx.textAlign = "center"
let c = 0
let startIndex = 0
dragMult = 0
const inertia = false
const cutoff = 0
const normalize = true
const repell = true
let uniform = false
let distanceScale = 16
let scale = 4
let strokeEnabled = false;
let stop = false;
let distanceMatrix = distanceMatrix_test
let visibleElements = 90
let totalVisibleElements = visibleElements
let tensions = []
let enabled = []
let showAngry = true
let showHappy = true
let showNeutral = true
let zoomcount = 0
let exemplars = exemplars_all_test
let clusters = clusters_all_test
let removeWorst = false
let removeAmount = 5


$(document).ready(function() {
    $('#clusters').bind('mousewheel', function(e) {
        x = e.originalEvent.clientX
        y = e.originalEvent.clientY
        if (e.originalEvent.wheelDelta > 0) {
            let zoomfactor = 1.2
            ctx.transform(zoomfactor, 0, 0, zoomfactor, -(zoomfactor - 1) * x, -(zoomfactor - 1) * y)
            zoomcount++;
        } else {
            if (zoomcount == 0) return;
            let zoomfactor = 1 / 1.2
            ctx.transform(zoomfactor, 0, 0, zoomfactor, -(zoomfactor - 1) * x, -(zoomfactor - 1) * y)
            zoomcount--;
        }
    });
});

bindButtons();
init();

function computeClusters() {
    clusterObjectsAngry = []
    for (let i = 0; i < clusters_angry_test.length; i++) {
        clusterObjectsAngry.push({ exemplar: exemplars_angry_test[i], cluster: clusters_angry_test[i] })
    }
    clusterObjectsAngry.sort((c1, c2) => c2.cluster.length - c1.cluster.length)
    clusterObjectsHappy = []
    for (let i = 0; i < clusters_happy_test.length; i++) {
        clusterObjectsHappy.push({ exemplar: exemplars_happy_test[i], cluster: clusters_happy_test[i] })
    }
    clusterObjectsHappy.sort((c1, c2) => c2.cluster.length - c1.cluster.length)
    clusterObjectsNeutral = []
    for (let i = 0; i < clusters_neutral_test.length; i++) {
        clusterObjectsNeutral.push({ exemplar: exemplars_neutral_test[i], cluster: clusters_neutral_test[i] })
    }
    clusterObjectsNeutral.sort((c1, c2) => c2.cluster.length - c1.cluster.length)
}

function init() {
    refreshEnabled()
    stop = false;

    positions = new Array(distanceMatrix.length)
    for (let i = 0; i < positions.length; i++) {
        positions[i] = [getRandomXPos(), getRandomYPos()]
        velocities[i] = [0, 0]
    }
    if (!normalize) {
        scale = 0.05 / totalVisibleElements
    }

    loop()
}

function refreshEnabled() {
    let third = visibleElements / 3
    totalVisibleElements = 0
    enabled = []
    offset = 0
    if (showAngry) {
        for (let i = offset; i < offset + third; i++) {
            enabled[i] = true
        }
        totalVisibleElements += third
    }
    if (showHappy) {
        for (let i = offset + 300; i < offset + 300 + third; i++) {
            enabled[i] = true
        }
        totalVisibleElements += third
    }
    if (showNeutral) {
        for (let i = offset + 600; i < offset + 600 + third; i++) {
            enabled[i] = true
        }
        totalVisibleElements += third
    }
    if (enabled.length < 899)
        enabled[899] = false
        //shuffle(enabled)
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
    for (let index = startIndex; index < positions.length - 1; index++) {
        if (!enabled[index]) continue;
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
    for (let n = index + 1; n < distanceMatrix.length; n++) {
        if (!enabled[n]) continue;
        if (n == index) continue;
        targetDist = Math.max(2, Math.abs(distanceMatrix[n][index]) * distanceScale)
        xDist = positions[index][0] - positions[n][0]
        yDist = positions[index][1] - positions[n][1]
        actualDist = dist(positions[index][0], positions[index][1], positions[n][0], positions[n][1])
        totalForce = actualDist - targetDist
            // neutralize repelling forces
        if (!repell && (actualDist < targetDist)) totalForce *= 0;
        xForce = -totalForce * xDist / actualDist
        yForce = -totalForce * yDist / actualDist
        velocities[index][0] += xForce
        velocities[index][1] += yForce
        velocities[n][0] -= xForce
        velocities[n][1] -= yForce
    }
}

function doStep() {

    for (let n = startIndex; n < velocities.length; n++) {
        if (!enabled[n]) continue;
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
        if (!enabled[n]) continue;
        xSum += Math.abs(velocities[n][0])
        ySum += Math.abs(velocities[n][1])
    }
    total = (xSum + ySum) * 0.0001
    total = Math.max(Math.pow(totalVisibleElements, 1.3), total)

    for (let n = 0; n < velocities.length; n++) {
        velocities[n][0] /= total
        velocities[n][1] /= total
    }
}

function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1)
}

function drag(v) {
    return Math.min(dragMult * 0.1 * v, dragMult * 0.02 * Math.pow(v, 2))
}

function drawData(stroke) {
    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = "#000"
    const third = Math.floor(positions.length / 3)

    tension = 0
    tension_abs = 0
    cnt = 0
    for (let i = 0; i < tensions.length; i++) {
        tensions[i] = 0
    }
    if (stroke) {
        ctx.strokeStyle = "#666"
        ctx.lineWidth = 1
    }
    for (let i = startIndex; i < positions.length - 1; i++) {
        if (!enabled[i])
            continue;
        for (let j = i + 1; j < positions.length; j++) {
            if (!enabled[j])
                continue;

            targetDist = Math.max(2, Math.abs(distanceMatrix[i][j]) * distanceScale)
            xDist = positions[i][0] - positions[j][0]
            yDist = positions[i][1] - positions[j][1]
            actualDist = dist(positions[i][0], positions[i][1], positions[j][0], positions[j][1])
            totalForce = actualDist - targetDist
            tension_abs += Math.abs(totalForce)
            const _tension = Math.max(actualDist / targetDist, targetDist / actualDist) - 1
            tension += _tension
            tensions[i] += _tension / totalVisibleElements
            tensions[j] += _tension / totalVisibleElements
            cnt++;

        }
    }

    if (stroke) {
        ctx.beginPath()
        for (let cluster of clusters) {
            avgX = 0
            avgY = 0
            _cnt = 0
            for (let i = 0; i < cluster.length; i++) {
                if (!enabled[cluster[i]]) continue
                avgX += positions[cluster[i]][0]
                avgY += positions[cluster[i]][1]
                _cnt++;
            }
            if (_cnt == 0) continue
            avgX /= _cnt
            avgY /= _cnt
            for (let i = 0; i < cluster.length; i++) {
                if (!enabled[cluster[i]]) continue
                ctx.moveTo(positions[cluster[i]][0], positions[cluster[i]][1])
                ctx.lineTo(avgX, avgY)
            }
        }
        ctx.stroke()
    }


    for (let i = startIndex; i < positions.length; i++) {
        if (!enabled[i]) continue;

        ctx.beginPath();
        opacity = Math.max(Math.min(1, 0.5 / tensions[i]), 0.01)
        if (i < third) {
            ctx.fillStyle = "rgba(200,0,0," + opacity + ")"
        } else if (i < third * 2) {
            ctx.fillStyle = "rgba(0,200,0," + opacity + ")"
        } else {
            ctx.fillStyle = "rgba(0,0,200," + opacity + ")"
        }
        ctx.moveTo(positions[i][0], positions[i][1])
        ctx.arc(positions[i][0], positions[i][1], 4 * opacity, 0, Math.PI * 2)
        ctx.fill()

        //ctx.stroke();
        ctx.closePath()
    }
    if (stroke) {
        ctx.fillStyle = "rgba(0,0,0,0.7)"
        for (let cluster of clusters) {
            avgX = 0
            avgY = 0
            _cnt = 0
            for (let i = 0; i < cluster.length; i++) {
                if (!enabled[cluster[i]]) continue
                avgX += positions[cluster[i]][0]
                avgY += positions[cluster[i]][1]
                _cnt++
            }
            avgX /= _cnt
            avgY /= _cnt
            ctx.beginPath()
            ctx.arc(avgX, avgY, 10, 0, Math.PI * 2)

            ctx.fillText(clusters.indexOf(cluster), avgX, avgY)
            ctx.fill()
        }
    }

    tension /= cnt
    tension_abs /= cnt
    $('#tension').html('Avg. tension: ' + Math.round(tension * 100) + '% / absolute: ' + Math.round(tension_abs))

    if (removeWorst) {
        removeWorst = false;
        removeWorstPoints(tensions)
    }
}

function removeWorstPoints(tensions) {
    for (let i = 0; i < removeAmount; i++) {
        index = tensions.indexOf(Math.max(...tensions))
        enabled[index] = false
        tensions[index] = 0
    }
}

function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }

    return array;
}

function bindButtons() {
    let buttons1 = $('.buttonbar').children();
    for (let i = 0; i < buttons1.length; i++) {
        $(buttons1[i]).click(function(e) {

            $(e.currentTarget).toggleClass('active')
            if (i == 1) {
                showAngry = !showAngry
            }
            if (i == 2) {
                showHappy = !showHappy
            }
            if (i == 3) {
                showNeutral = !showNeutral
            }
            requestAnimationFrame(() => refreshEnabled());
        })
    }
    let buttons2 = $('.buttonbar2').children();
    for (let i = 0; i < buttons2.length; i++) {
        $(buttons2[i]).click(function(e) {
            $('.buttonbar2').find('.active').removeClass('active');
            $(e.currentTarget).addClass('active')
            if (i == 1) {
                distanceMatrix = distanceMatrix_test
            }
            if (i == 2) {
                distanceMatrix = distanceMatrix_direct_test.map(row => row.map((i) => i * 2))
            }
            if (i == 3) {
                distanceMatrix = distanceMatrix_deriv_test.map(row => row.map((i) => i * 2))
            }
        })
    }
    let buttons3 = $('.buttonbar3').children();
    for (let i = 0; i < buttons3.length; i++) {
        $(buttons3[i]).click(function(e) {
            $('.buttonbar3').find('.active').removeClass('active');
            $(e.currentTarget).addClass('active')
            if (i == 1) {
                scale = 1
            }
            if (i == 2) {
                scale = 4
            }
            if (i == 3) {
                scale = 8
            }
        })
    }
    let buttons4 = $('.buttonbar4').children();
    for (let i = 0; i < buttons4.length; i++) {
        $(buttons4[i]).click(function(e) {
            $('.buttonbar4').find('.active').removeClass('active');
            $(e.currentTarget).addClass('active')
            if (i == 1) {
                visibleElements = 900
            }
            if (i == 2) {
                visibleElements = 300
            }
            if (i == 3) {
                visibleElements = 90
            }
            requestAnimationFrame(() => refreshEnabled());
        })
    }
    let buttons7 = $('.buttonbar7').children();
    for (let i = 0; i < buttons7.length; i++) {
        $(buttons7[i]).click(function(e) {
            strokeEnabled = !strokeEnabled
            $('.buttonbar7').find('button').toggleClass('active');
        })
    }
    let buttons5 = $('.buttonbar5').children();
    for (let i = 0; i < buttons5.length; i++) {
        $(buttons5[i]).click(function(e) {
            $('.buttonbar5').find('.active').removeClass('active');
            $(e.currentTarget).addClass('active')
            if (i == 2) {
                clusters = clusters_angry_test
                exemplars = exemplars_angry_test
            }
            if (i == 3) {
                clusters = clusters_happy_test.map(row => row.map((i) => i + 300))
                exemplars = exemplars_happy_test.map(i => i + 300)
            }
            if (i == 4) {
                clusters = clusters_neutral_test.map(row => row.map((i) => i + 600))
                exemplars = exemplars_neutral_test.map(i => i + 600)
            }
        })
    }

    let buttons6 = $('.buttonbar6').children();
    for (let i = 0; i < buttons6.length; i++) {
        $(buttons6[i]).click(function(e) {
            if (i == 1) {
                removeAmount = 1
                removeWorst = true
            }
            if (i == 2) {
                removeAmount = 5
                removeWorst = true
            }
            if (i == 3) {
                refreshEnabled()
            }
        })
    }
}