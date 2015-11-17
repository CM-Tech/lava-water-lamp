// SPH
// http://wonderfl.net/c/2pg0
// を、JavaScript化したもの

function whenClick(event) {
    clickControl(event);
}

function whenMove(event) {
    clickControl(event);
}

function clickControl(event) {

    mouseX = event.layerX;
    mouseY = event.layerY;
    if (event.buttons == 1 || event.buttons == 2)
        press = true;
    else
        press = false;

}
var RANGE2;
var w = $("body").width();
var h = $("body").height();
var SPH = {
    GRAVITY: 0.025,
    RANGE: 25,
    PRESSURE: 1,
    VISCOSITY: 0.005
};
$("body").keydown(function(event) {
    console.log(event.which);
    if (event.which == 38) {
        event.preventDefault();
        SPH.RANGE = SPH.RANGE + 1;
    }
    if (event.which == 40) {
        event.preventDefault();
        SPH.RANGE--;
    }
});
var mouseX;
var mouseY;
var press = false;
var initialize = (function() {
    var col = 0;
    $("#canvas").attr("width", $("body").width());
    $("#canvas").attr("height", $("body").height());

    RANGE2 = SPH.RANGE * SPH.RANGE;
    var DENSITY = 0.2;
    var NUM_GRIDSX = Math.floor(w / 150);
    var NUM_GRIDSY = Math.floor(h / 150);
    var INV_GRID_SIZEX = 1 / (w / NUM_GRIDSX);
    var INV_GRID_SIZEY = 1 / (h / NUM_GRIDSY);
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var particles = [];
    var numParticles = 0;
    var neighbors = [];
    var numNeighbors = 0;
    var count = 0;

    var grids = [];
    var delta = 0;

    function tick() {
        delta++;
    }

    function frame(e) {

        if (press)
            pour();

        var tempDelta = delta + 0;
        delta = 0;
        move(tempDelta);
        ctx.clearRect(0, 0, w, h);
        var d = draw();
        ctx.font = "30px Arial";
        ctx.fillText("" + SPH.RANGE, 10, 30);


    }

    function draw() {
        //var maxDensity=0;
        ctx.fillStyle = "blue";
        ctx.strokeStyle = "blue";
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2 + 2, 0, 2 * Math.PI, false);
            //var color=HSVtoRGB(Math.sqrt(p.density*4),1,1);
            //ctx.fillStyle="rgb("+color.r+","+color.g+","+color.b+")";
            //maxDensity=Math.max(maxDensity,p.density);
            ctx.fill();


        }

        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];

            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, 2 * Math.PI, false);
            var color = HSVtoRGB(0.6, 1, 1.5 - Math.sqrt(p.density * 2));
            color = HSVtoRGB(0.6, 1, p.size / 50);
            //color=HSVtoRGB(Math.sqrt(p.density*4),1,1);
            ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + ",01)";

            //maxDensity=Math.max(maxDensity,p.density);
            ctx.fill();

        }
        ctx.globalCompositeOperation = 'luminosity';
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];

            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, 2 * Math.PI, false);
            var color = HSVtoRGB(0.6, 1, 1.5 - Math.sqrt(p.density * 2));
            color = HSVtoRGB(0.6, 1, p.size / 50);
            //color=HSVtoRGB(Math.sqrt(p.density*4),1,1);
            ctx.fillStyle = "rgba(" + color.r + "," + color.g + "," + color.b + ",01)";

            //maxDensity=Math.max(maxDensity,p.density);
            ctx.fill();

        }
        ctx.globalCompositeOperation = 'normal';
        //ctx.fillStyle="rgba(0,0,255,"+maxDensity*2+")";
        //return maxDensity;

    }

    function pour() {
        if (count % 5 == 0) {
            /*for (var i = -10; i <= 10; i++) {
                for (var j = -10; j <= 10; j++) {
                    if(j*j+i*i<16){
                var p = new Particle(mouseX + i * 10, mouseY+j*10);
                p.vy = 3;
                particles[numParticles++] = p;
                    }
            */
            var p = new Particle(mouseX, mouseY);
            p.vy = 3;
            particles[numParticles++] = p;

        }
    }

    function calc() {
        updateGrids();
        findNeighbors();
        calcPressure();
        calcForce();
    }

    function move(d) {
        count++;
        //var i;
        //var p;

        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            for (var j = 0; j < d; j++) {
                p.move();
            }
        }
    }

    function updateGrids() {
        var i;
        var j;
        for (i = 0; i < NUM_GRIDSX; i++)
            for (j = 0; j < NUM_GRIDSY; j++)
                grids[i][j].clear();
        for (i = 0; i < numParticles; i++) {
            var p = particles[i];
            p.fx = p.fy = p.density = 0;
            p.gx = Math.floor(p.x * INV_GRID_SIZEX);
            p.gy = Math.floor(p.y * INV_GRID_SIZEY);
            if (p.gx < 0)
                p.gx = 0;
            if (p.gy < 0)
                p.gy = 0;
            if (p.gx > NUM_GRIDSX - 1)
                p.gx = NUM_GRIDSX - 1;
            if (p.gy > NUM_GRIDSY - 1)
                p.gy = NUM_GRIDSY - 1;
            grids[p.gx][p.gy].add(p);
        }
    }

    function findNeighbors() {
        numNeighbors = 0;
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            var xMin = p.gx != 0;
            var xMax = p.gx != NUM_GRIDSX - 1;
            var yMin = p.gy != 0;
            var yMax = p.gy != NUM_GRIDSY - 1;
            findNeighborsInGrid(p, grids[p.gx][p.gy]);
            if (xMin) findNeighborsInGrid(p, grids[p.gx - 1][p.gy]);
            if (xMax) findNeighborsInGrid(p, grids[p.gx + 1][p.gy]);
            if (yMin) findNeighborsInGrid(p, grids[p.gx][p.gy - 1]);
            if (yMax) findNeighborsInGrid(p, grids[p.gx][p.gy + 1]);
            if (xMin && yMin) findNeighborsInGrid(p, grids[p.gx - 1][p.gy - 1]);
            if (xMin && yMax) findNeighborsInGrid(p, grids[p.gx - 1][p.gy + 1]);
            if (xMax && yMin) findNeighborsInGrid(p, grids[p.gx + 1][p.gy - 1]);
            if (xMax && yMax) findNeighborsInGrid(p, grids[p.gx + 1][p.gy + 1]);
        }
    }

    function findNeighborsInGrid(pi, g) {
        for (var j = 0; j < g.numParticles; j++) {
            var pj = g.particles[j];
            if (pi == pj)
                continue;
            var distance = (pi.x - pj.x) * (pi.x - pj.x) + (pi.y - pj.y) * (pi.y - pj.y);
            if (distance < (pi.size / 2 + pj.size / 2) * (pi.size / 2 + pj.size / 2)) {
                if (neighbors.length == numNeighbors)
                    neighbors[numNeighbors] = new Neighbor();
                neighbors[numNeighbors++].setParticle(pi, pj);
            }
        }
    }

    function calcPressure() {
        for (var i = 0; i < numParticles; i++) {
            var p = particles[i];
            if (p.density < DENSITY)
                p.density = DENSITY;
            p.pressure = p.density - DENSITY;
        }
    }

    function calcForce() {
        for (var i = 0; i < numNeighbors; i++) {
            var n = neighbors[i];
            n.calcForce();
        }
    }
    return function() {
        for (var i = 0; i < NUM_GRIDSX; i++) {
            grids[i] = new Array(NUM_GRIDSY);
            for (var j = 0; j < NUM_GRIDSY; j++)
                grids[i][j] = new Grid();
        }
        for (var y = 25; y < 250; y += 25) {
            for (var x = 25; x < w - 25; x += 25) {
                var p = new Particle(x, h - y);
                p.vy = 0;
                particles[numParticles++] = p;
            }
        }
        window.addEventListener('mouseup', function(e) {
            press = false;
        }, false);
        window.setInterval(frame, 0.01);
        window.setInterval(tick, 0.1);
        window.setInterval(calc, 1);
    };
})();

var Particle = function(x, y) {
    this.x = x;
    this.y = y;
    this.gx = 0;
    this.gy = 0;
    this.vx = 0;
    this.vy = 0;
    this.fx = 0;
    this.fy = 0;
    this.density = 0;
    this.pressure = 0;
    this.size = SPH.RANGE;

};
Particle.prototype = {
    move: function() {
        this.vy += SPH.GRAVITY;
        this.vx += this.fx + Math.random() * 0.1 - 0.05;
        this.vy += this.fy + Math.random() * 0.1 - 0.05;
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 10)
            this.vx += (10 - this.x) * 0.5 - this.vx * 0.5;
        if (this.y < 10)
            this.vy += (10 - this.y) * 0.5 - this.vy * 0.5;
        if (this.x > w)
            this.vx += (w - this.x) * 0.5 - this.vx * 0.5;
        if (this.y > h)
            this.vy += (h - this.y) * 0.5 - this.vy * 0.5;

        this.size += 0.05 * (125 - (h - this.y)) / 125;
        this.size = Math.max(Math.min(this.size, 75), 25);

    }
};

var Neighbor = function() {
    this.p1 = null;
    this.p2 = null;
    this.distance = 0;
    this.nx = 0;
    this.ny = 0;
    this.weight = 0;
};
Neighbor.prototype = {
    setParticle: function(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.nx = p1.x - p2.x;
        this.ny = p1.y - p2.y;
        this.distance = Math.sqrt(this.nx * this.nx + this.ny * this.ny);
        this.weight = 1 - this.distance / (this.p1.size / 2 + this.p2.size / 2);
        var temp = this.weight * this.weight * this.weight;
        p1.density += temp;
        p2.density += temp;
        temp = 1 / this.distance;
        this.nx *= temp;
        this.ny *= temp;
    },
    calcForce: function() {
        var p1 = this.p1;
        var p2 = this.p2;
        var pressureWeight = this.weight * (p1.pressure + p2.pressure) / (p1.density + p2.density) * SPH.PRESSURE;
        var viscosityWeight = this.weight / (p1.density + p2.density) * SPH.VISCOSITY;
        p1.fx += this.nx * pressureWeight;
        p1.fy += this.ny * pressureWeight;
        p2.fx -= this.nx * pressureWeight;
        p2.fy -= this.ny * pressureWeight;
        var rvx = p2.vx - p1.vx;
        var rvy = p2.vy - p1.vy;
        p1.fx += rvx * viscosityWeight;
        p1.fy += rvy * viscosityWeight;
        p2.fx -= rvx * viscosityWeight;
        p2.fy -= rvy * viscosityWeight;
    },
};

var Grid = function() {
    this.particles = [];
    this.numParticles = 0;
};
Grid.prototype = {
    clear: function() {
        this.numParticles = 0;
    },
    add: function(p) {
        this.particles[this.numParticles++] = p;
    }
};

initialize();

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v, g = t, b = p;
            break;
        case 1:
            r = q, g = v, b = p;
            break;
        case 2:
            r = p, g = v, b = t;
            break;
        case 3:
            r = p, g = q, b = v;
            break;
        case 4:
            r = t, g = p, b = v;
            break;
        case 5:
            r = v, g = p, b = q;
            break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}