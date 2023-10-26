console.log("Loaded")

var canvas, ctx, stats, configs;
window.addEventListener('load', () => {
    console.log("After load")

    canvas = document.getElementById("tester");
    ctx = canvas.getContext("2d");

    stats = document.getElementById("stats")
    configs = document.getElementById("configs")

    canvas.addEventListener('mousedown', press);
    canvas.addEventListener('touchstart', press);
    document.body.onkeydown = function(e) { if (e.key == " " || e.code == "Space" || e.keyCode == 32) press() }

    document.getElementById("begin").addEventListener("click", begin)
    document.getElementById("reset").addEventListener("click", reset)

    window.addEventListener('resize', resize);
    resize()

    generateConfigShapes()
    intervalConfig()
});

var timeout, counter, timer, shape, points, times, settings;
function begin() {
    if (timeout) {
        return;
    }

    settings = new FormData(configs)

    points = [0, 0, 0];
    times = [[], {}];
    counter = settings.get("counter") || 10;

    updateStats()

    timeout = setTimeout(draw, 2000);
}

function end() {
    updateStats()
    reset()
}

function reset() {
    clearTimeout(timeout);
    timeout = null;

    points = null;
    times = null; 

    undraw()
}

function draw() {
    shape = shapes[Math.floor(Math.random() * shapes.length)];

    var scale = getRandomInt(100, 275),
        rotation = getRandomInt(0, 180);

    var x = getRandomInt(scale, width-scale),
        y = getRandomInt(scale, height-scale);

    shape.draw(ctx, x, y, scale, rotation, "#000")
    timer = Date.now()

    if (settings.getAll("shapes").includes(shape.getName())) {
        counter--
    } else {
        timeout = setTimeout(redraw, settings.get("duration") * 1000 || 3000)
    }
}

function redraw() {
    undraw()

    var interval = settings.getAll("interval")
    timeout = setTimeout(draw, getRandomInt(interval[0] || 0.5, interval[1] || 2) * 1000)
}

function undraw() {
    clear()
    shape = null;
    timer = null;
}

function press() {
    if (!points) {
        return
    }

    if (!shape) {
        points[2]++
    } else {
        if (settings.getAll("shapes").includes(shape.getName())) {
            points[0]++

            var time = Date.now() - timer;

            if (!times[1][shape.getName()]) {
                times[1][shape.getName()] = []
            }
            times[1][shape.getName()].push(time)
            times[0].push(time)

            if (counter <= 0) {
                end()
                return;
            } else {
                redraw()
            }
        } else {
            points[1]++
        }
    }
    updateStats()
}

function updateStats() {
    out = []
    out.push(`Zobrazenia ${counter} / ${settings.get("counter") || 10}`)
    out.push(`Dobré / Zlé / Mimo - ${points.join(" / ")}`)
    out.push(`Presnosť ${Math.round((points[0] /(points[0] + points[1]) || 0) * 1000) / 10} %`)
    out.push(`Priemerný čas - ${average(times[0])} ms`)

    out.push("\nČasy:")
    for (var [key, item] of Object.entries(times[1])) {
        out.push(`- ${key} - ${average(item)} ms`)
    }

    stats.innerText = out.join("\n")
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}


function average(array) {
    if (!array.length) {
        return 0;
    }
    return Math.round(array.reduce((a, b) => a + b) / array.length * 100) / 100;
}


var width, height;
function resize() {
    width = canvas.getBoundingClientRect().width;
    height = canvas.getBoundingClientRect().height;

    ctx.canvas.width = width;
    ctx.canvas.height = height

    background();
}

function background() {
    ctx.fillStyle = '#ECE5E5';
    ctx.fillRect(0, 0, width, height);
}

function clear() {
    ctx.clearRect(0, 0, width, height)
    background()
}

class Shape {
    getPoints(scale) {
        return [];
    }

    getName() {
        return null;
    }

    rotate(points, angle, origin_x, origin_y) {
        var radians = (Math.PI / 180) * angle,
            cos_val = Math.cos(radians),
            sin_val = Math.sin(radians),
            newPoints = [];
        for (let point of points) {
            let x_val = point[0] - origin_x,
                y_val = point[1] - origin_y; 
            let nx = x_val * cos_val - y_val * sin_val + origin_x,
                ny = x_val * sin_val + y_val * cos_val + origin_y;
            newPoints.push([nx, ny])
        }
        return newPoints;
    }

    offset(points, x, y) {
        var newPoints = []
        for (let point of points) {
            newPoints.push([point[0] + x, point[1] + y])
        }
        return newPoints;
    }

    draw(ctx, x, y, scale, rotation, color) {
        let points = this.getPoints(scale);
            points = this.rotate(points, rotation, 0, 0);
            points = this.offset(points, x, y);

        ctx.fillStyle = color
        ctx.beginPath()

        ctx.moveTo(points[0][0], points[0][1])

        for (let point of points) { ctx.lineTo(point[0], point[1]) }

        ctx.closePath();
        ctx.fill();
    }
}

class Square extends Shape {
    getName() {
        return "Square";
    }

    getPoints(scale) {
        return [
            [0, scale], 
            [-scale, 0], 
            [0, -scale],
            [ scale, 0]
        ];
    }
}

class Triangle extends Shape {
    getName() {
        return "Triangle";
    }

    getPoints(scale) {
        return [
            [-scale, 0], 
            [0, scale], 
            [scale, 0],
        ];
    }
}

class Circle extends Shape {
    getName() {
        return "Circle";
    }

    draw(ctx, x, y, scale, rotation, color) {
        ctx.fillStyle = color
        ctx.beginPath()

        ctx.arc(x, y, scale, 0, 2 * Math.PI, false)

        ctx.closePath();
        ctx.fill();
    }
}

class Star extends Shape {
    getName() {
        return "Star";
    }

    getPoints(scale) {
        var rad = Math.PI / 180
        return [
            [scale, 0],
            [scale * Math.cos(rad * 72 * 2), scale * Math.sin(rad * 72 * 2)],
            [scale * Math.cos(rad * 72 * -1), scale * Math.sin(rad * 72 * -1)],
            [scale * Math.cos(rad * 72 * 1), scale * Math.sin(rad * 72 * 1)],
            [scale * Math.cos(rad * 72 * -2), scale * Math.sin(rad * 72 * -2)]
        ]
    }
}

class Hexagon extends Shape {
    getName() {
        return "Hexagon";
    }

    getPoints(scale) {
        var rad = Math.PI / 180
        return [
            [scale, 0],
            [scale * Math.cos(rad * 60 * 1), scale * Math.sin(rad * 60 * 1)],
            [scale * Math.cos(rad * 60 * 2), scale * Math.sin(rad * 60 * 2)],
            [-scale, 0],
            [scale * Math.cos(rad * 60 * 4), scale * Math.sin(rad * 60 * 4)],
            [scale * Math.cos(rad * 60 * 5), scale * Math.sin(rad * 60 * 5)]
        ]
    }
}

const shapes = [
    new Square(),
    new Triangle(),
    new Circle(),
    new Star(),
    new Hexagon(),
];

function generateConfigShapes() {
    let div = document.getElementById("configs-shapes")

    for (let shape of shapes) {
        shapeName = shape.getName()

        let subdiv = document.createElement("div")

        let checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.name = "shapes"
        checkbox.value = shapeName
        // checkbox.checked = true

        let text = document.createElement("span");
        text.textContent = shapeName;

        subdiv.appendChild(checkbox);
        subdiv.appendChild(text)
        
        div.appendChild(subdiv);
    }
}

function intervalConfig() {
    var intervalMin = document.getElementById("interval-min")
    var intervalMax = document.getElementById("interval-max")

    validate = (e) => {
        e.target.value = Math.max(e.target.value, e.target.min)
    }

    intervalMin.addEventListener("change", validate)
    intervalMax.addEventListener("change", validate)

    intervalMin.addEventListener("change", (e) => {
        intervalMax.min = intervalMin.value
        intervalMax.value = Math.max(intervalMax.value, intervalMax.min)
    })
}
