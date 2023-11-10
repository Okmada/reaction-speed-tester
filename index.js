console.log("Loaded")

var canvas, ctx, stats, configs, button;
window.addEventListener('load', () => {
    console.log("After load")

    canvas = document.getElementById("tester");
    ctx = canvas.getContext("2d");

    stats = document.getElementById("stats")
    configs = document.getElementById("configs")

    canvas.addEventListener('mousedown', press);
    canvas.addEventListener('touchstart', press);
    document.body.onkeydown = function(e) { if (e.key == " " || e.code == "Space" || e.keyCode == 32) press() }

    button = document.getElementById("button")
    button.addEventListener("click", begin)

    window.addEventListener('resize', resize);
    resize()

    generateConfig()
});

var timeout, counter, timer, shape, points, times, settings;
function begin() {
    if (timeout) {
        reset()
        return;
    }
    clear()

    button.innerText = "Reset"

    settings = new FormData(configs)

    points = [0, 0, 0];
    times = {};
    counter = settings.get("counter");

    updateStats()

    timeout = setTimeout(draw, 2000);
}

function reset() {
    clearTimeout(timeout);
    timeout = null;

    points = null;
    times = null;

    button.innerText = "Začať"

    undraw()
}

var csv;
function end() {
    updateStats()

    csv = "data:text/csv;charset=utf-8,";
    csv += points.map((e, i) => {
        return`${["DOBRE", "ZLE", "MIMO"][i]}, ${e}` 
    }).join(", ") + "\n"
    Object.keys(times).forEach((key) => {
        csv += `${key}, ${times[key].join(", ")}\n`
    })

    var downloadButton = document.createElement("button");
        downloadButton.innerText = "Stiahnúť dáta"
        downloadButton.addEventListener("click", () => {download(encodeURI(csv), `${getTimestamp()}.csv`)})
    stats.prepend(downloadButton);

    reset()
    writeText("Koniec testu")
}

function draw() {
    shape = shapes[Math.floor(Math.random() * shapes.length)];
    var side = Math.min(width, height)

    var scale = getRandomInt(side/16, side/4),
        rotation = getRandomInt(0, 180);

    var x = getRandomInt(scale, width-scale),
        y = getRandomInt(scale, height-scale);

    var color = settings.get("colors") ? `hsl(${getRandomInt(0, 360)}, 100%, ${80 * Math.sqrt(Math.random())}%)` : "#000"

    shape.draw(ctx, x, y, scale, rotation, color)
    timer = Date.now()

    if (settings.getAll("shapes").includes(shape.getName())) {
        counter--
    } else {
        timeout = setTimeout(redraw, settings.get("duration") * 1000)
    }
}

function redraw() {
    undraw()

    var interval = settings.getAll("interval")
    timeout = setTimeout(draw, getRandomInt(interval[0], interval[1]) * 1000)
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

            if (!times[shape.getName()]) {
                times[shape.getName()] = []
            }
            times[shape.getName()].push(time)

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
    out.push(`Priemerný čas - ${average(Object.keys(times).map((e) => { return times[e] }).flat())} ms`)

    out.push("\nČasy:")
    for (var [key, item] of Object.entries(times)) {
        out.push(`- ${key} - ${average(item)} ms`)
    }

    stats.innerText = out.join("\n")
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

function download(url, name) {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.append(a)
    a.click()
    document.body.removeChild(a)
}

function getTimestamp() {
    const date = new Date()
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day =`${date.getDate()}`.padStart(2, '0');
    const hour = `${date.getHours()}`.padStart(2, '0');
    const minute = `${date.getMinutes()}`.padStart(2, '0');
    const second = `${date.getSeconds()}`.padStart(2, '0');
    return `${year}-${month}-${day}_${hour}-${minute}-${second}`
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

function writeText(text) {
    clear()

    ctx.fillStyle = '#000000';
    ctx.font = "100px serif";
    ctx.textAlign = "center";
    ctx.fillText(text, width/2, height/2)
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

function createTextSpan(text) {
    let span = document.createElement("span")
    span.textContent = text
    return span
}

function generateConfig() {
    // DEFAULT VALIDATION
    validate = (e) => {
        e.target.value = e.target.value ? Math.max(e.target.value, e.target.min) : e.target.default
    }

    // POVOLENE TVARY
    configs.append(createTextSpan("Povolené tvary:"))

    let configs_shapes = document.createElement("div")

    for (let shape of shapes) {
        shapeName = shape.getName()

        let subdiv = document.createElement("div")

        let checkbox = document.createElement("input")
            checkbox.type = "checkbox"
            checkbox.name = "shapes"
            checkbox.value = shapeName

        subdiv.append(checkbox);
        subdiv.append(createTextSpan(shapeName))
        
        configs_shapes.append(subdiv);
    }

    configs.append(configs_shapes)

    configs.append(document.createElement("hr"))

    // NAHODNE FARBY
    let checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.name = "colors"
    configs.append(checkbox)

    configs.append(createTextSpan("Náhodné farby"))

    configs.append(document.createElement("hr"))

    // POCET ZOBRAZENI
    configs.append(createTextSpan("Počet zobrazení"))

    var input = document.createElement("input")
        input.name = "counter"
        input.type = "number"

        input.min = 1
        input.default = 10

        input.value = input.default
        input.addEventListener("change", validate)
    configs.append(input)

    configs.append(document.createElement("hr"))

    // DLZKA ZOBRAZENIA
    configs.append(createTextSpan("Dĺžka zobrazenia"))

    var input = document.createElement("input")
        input.name = "duration"
        input.type = "number"

        input.min = 0
        input.default = 3

        input.value = input.default
        input.addEventListener("change", validate)
    configs.append(input)

    configs.append(createTextSpan("sek"))

    configs.append(document.createElement("hr"))

    // INTERVAL PAUZY
    configs.append(createTextSpan("Interval pauzy"))

    var div = document.createElement("div")

        var interval_min = document.createElement("input")
            interval_min.name = "interval"
            interval_min.type = "number"

            interval_min.min = 0
            interval_min.default = 0.5

            interval_min.value = interval_min.default
            interval_min.addEventListener("change", validate)
        div.append(interval_min)

        div.append(createTextSpan("-"))

        var interval_max = document.createElement("input")
            interval_max.name = "interval"
            interval_max.type = "number"

            interval_max.min = 0
            interval_max.default = 2

            interval_max.value = interval_max.default
            interval_max.addEventListener("change", validate)
        div.append(interval_max)

        interval_min.addEventListener("change", (e) => {
            interval_max.min = interval_min.value
            interval_max.value = Math.max(interval_max.value, interval_max.min)
        })

        div.append(createTextSpan("sek"))

    configs.append(div)
}