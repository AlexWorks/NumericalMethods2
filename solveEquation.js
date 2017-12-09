function Plot(config) {
    this.canvas = document.getElementById(config.canvas);
    this.minX = config.minX;
    this.minY = config.minY;
    this.maxX = config.maxX;
    this.maxY = config.maxY;
    this.unitsPerTickX = config.unitsPerTickX;
    this.unitsPerTickY = config.unitsPerTickY;

    this.axisColor = '#aaa';
    this.font = '12px Calibri';
    this.tickSize = 10;


    this.context = this.canvas.getContext('2d');
    this.rangeX = this.maxX - this.minX;
    this.rangeY = this.maxY - this.minY;
    this.unitX = this.canvas.width / this.rangeX;
    this.unitY = this.canvas.height / this.rangeY;

    this.iteration = (this.maxX - this.minX) / 1000;
    this.centerY = Math.round(Math.abs(this.minY / this.rangeY) * this.canvas.height);
    this.centerX = Math.round(Math.abs(this.minX / this.rangeX) * this.canvas.width);
    this.scaleX = this.unitX;
    this.scaleY = this.unitY;

    this.drawXAxis();
    this.drawYAxis();
}

Plot.prototype.drawXAxis = function() {
    var context = this.context;
    context.save();
    context.beginPath();
    context.moveTo(0, this.centerY);
    context.lineTo(this.canvas.width, this.centerY);
    context.strokeStyle = this.axisColor;
    context.lineWidth = 2;
    context.stroke();

    var xPosInc = this.unitsPerTickX * this.unitX;
    var xPos, unit;
    context.font = this.font;
    context.textAlign = 'center';
    context.textBaseline = 'top';

    xPos = this.centerX - xPosInc;
    unit = -1 * this.unitsPerTickX;

    while (xPos > 0) {
        context.moveTo(xPos, this.centerY - this.tickSize / 2);
        context.lineTo(xPos, this.centerY + this.tickSize / 2);
        context.stroke();
        context.fillText(unit, xPos, this.centerY + this.tickSize + 3);
        unit -= this.unitsPerTickX;
        xPos = Math.round(xPos - xPosInc);
    }

    xPos = this.centerX + xPosInc;
    unit = this.unitsPerTickX;
    while(xPos < this.canvas.width) {
        context.moveTo(xPos, this.centerY - this.tickSize / 2);
        context.lineTo(xPos, this.centerY + this.tickSize / 2);
        context.stroke();
        context.fillText(unit, xPos, this.centerY + this.tickSize / 2 + 3);
        unit += this.unitsPerTickX;
        xPos = Math.round(xPos + xPosInc);
    }

    context.restore();
};

Plot.prototype.drawYAxis = function() {
    var context = this.context;
    context.save();
    context.beginPath();
    context.moveTo(this.centerX, 0);
    context.lineTo(this.centerX, this.canvas.height);
    context.strokeStyle = this.axisColor;
    context.lineWidth = 2;
    context.stroke();

    // draw tick marks
    var yPosIncrement = this.unitsPerTickY * this.unitY;
    var yPos, unit;
    context.font = this.font;
    context.textAlign = 'right';
    context.textBaseline = 'middle';

    // draw top tick marks
    yPos = this.centerY - yPosIncrement;
    unit = this.unitsPerTickY;
    while(yPos > 0) {
        context.moveTo(this.centerX - this.tickSize / 2, yPos);
        context.lineTo(this.centerX + this.tickSize / 2, yPos);
        context.stroke();
        context.fillText(unit, this.centerX - this.tickSize / 2 - 3, yPos);
        unit += this.unitsPerTickY;
        yPos = Math.round(yPos - yPosIncrement);
    }

    // draw bottom tick marks
    yPos = this.centerY + yPosIncrement;
    unit = -1 * this.unitsPerTickY;
    while(yPos < this.canvas.height) {
        context.moveTo(this.centerX - this.tickSize / 2, yPos);
        context.lineTo(this.centerX + this.tickSize / 2, yPos);
        context.stroke();
        context.fillText(unit, this.centerX - this.tickSize / 2 - 3, yPos);
        unit -= this.unitsPerTickY;
        yPos = Math.round(yPos + yPosIncrement);
    }
    context.restore();
};

Plot.prototype.drawEquation = function (equation, color, thickness) {
    var context = this.context;
    context.save();
    this.transformContext();

    context.beginPath();
    context.moveTo(this.minX, equation(this.mixX));

    for (var x = this.minX + this.iteration; x <= this.maxX; x += this.iteration) {
        var res = equation(x);
        if (Math.abs(res) < 10000)
            context.lineTo(x, equation(x));
    }

    context.restore();
    context.lineJoin = 'round';
    context.lineWidth = thickness;
    context.strokeStyle = color;
    context.stroke();
    context.restore();
};

Plot.prototype.transformContext = function() {
    var context = this.context;

    this.context.translate(this.centerX, this.centerY);
    context.scale(this.scaleX, -this.scaleY);
};

function func (x) {
    return 2 * Math.pow(x,3) - 9 * Math.pow(x,2) - 60 * x + 1;
}

function testDerivative (x) {
    return (6 * x * x - 18 * x) / 60;
}

function createValuesTable (func) {
    let result = [];

    let lower = -10;
    let upper = 10;
    let dx = 0.5;
    let eps = 0.001;

    let x;

    for(x = lower; x <= upper; x += dx) {
        result.push([x, func(x)]);
    }

    if (Math.abs(x - upper) > eps) {
        result.pop();
        result.push([upper, func(upper)]);
    }

    return result;
}

function buildTable(tableData) {
    let table = document.createElement('table');
    table.className = 'results-table';

    let row = document.createElement('tr');
    let headings = ['x', 'f(x)'];

    for (let i = 0; i < headings.length; i++) {
        let th = document.createElement('th');
        th.innerHTML = headings[i];
        row.appendChild(th);
    }

    table.appendChild(row);

    for (let i = 0; i < tableData.length; i++) {
        let row = document.createElement('tr');

        for (let j = 0; j < tableData[i].length; j++) {
            let td = document.createElement('td');
            switch (j) {
                case 0:
                    td.innerHTML = tableData[i][j].toPrecision(4);
                    break;
                case 1:
                    td.innerHTML = tableData[i][j].toPrecision(6);
                    break;
                default:
                    break;
            }

            row.appendChild(td);
        }

        table.appendChild(row);
    }

    document.body.querySelector('.wrapper').appendChild(table);
}

function getCriticalPoints(table) {
    let res = [];
    for (let i = 0; i < table.length - 1; i++) {
        if ( table[i][1] > 0 &&  table[i + 1][1] < 0 ||  table[i][1] < 0 &&  table[i + 1][1] > 0) {
            res.push((table[i][0] + table[i + 1][0])/2);
        }
    }
    return res;
}

function solveIterative (x, func, eps) {
    let approx = [
        function (x) {
            return (109*Math.pow(x,2) - 1)/(2*Math.pow(x, 2) + 100*x - 60);
        },
        function (x) {
            return (1/60) * (2 * Math.pow(x, 3) - 9 * x * x + 1);
        },
        function (x) {
            return (60 * x - 1)/ (2 * x * x - 9 * x);
        }
    ];
    let k = 0;
    let max_it = 10000;
    let done = false;
    let xPrev = x;

    if ( x < -10 || x > 10) return NaN;

    while (k < max_it && !done) {
        if ( x < -2 ) {
            x = approx[2](xPrev);
        }
        else if ( x >= -2 && x < 1.6) {
            x = approx[1](xPrev);
        }
        else if ( x >= 1.6) {
            x = approx[0](xPrev)
        }
        k++;

        if (Math.abs(func(x)) < eps) {
            done = true;
        }

        xPrev = x;
    }
    if ( k >= max_it) {
        console.log("Failure!");
    }
    return {
        x: x,
        eps: eps,
        k: k
    };
}

function getRoots (points, eps, func) {
    let result = [];
    for (let i = 0; i < points.length; i++) {
        result.push(solveIterative(points[i], func, eps));
    }
    return result;
}

function drawDiagram(point, func) {

    let eps = 0.1;
    let res = [];

    for (let i = 0; i < 5; i++) {
        let temp = solveIterative(point, func, eps);
        res.push({
            eps: temp.eps,
            k: temp.k
        });
        eps = eps / 10;
    }


    AmCharts.makeChart( "chartdiv", {
        "type": "serial",
        "theme": "light",
        "columnWidth": 1,
        "dataProvider": res,
        "graphs": [{
            "fillColors": "#c55",
            "fillAlphas": 0.9,
            "lineColor": "#fff",
            "lineAlpha": 0.7,
            "type": "column",
            "valueField": "k"
        }],
        "categoryField": "eps",
        "categoryAxis": {
            "startOnAxis": true,
            "title": "Eps"
        },
        "valueAxes": [{
            "title": "k"
        }]
    });
}

function writeRoots(roots) {
    let str = "Roots<br>";
    for (let i = 0; i < roots.length; i++) {
        str += `${i}: ${roots[i].x}
        <br>`;
    }

    document.write(str);
}

let plot = new Plot({
    unitsPerTickX: 1,
    unitsPerTickY: 50,
    minX: -10,
    maxX: 10,
    minY: -300,
    maxY: 300,
    canvas: 'functionPlot'
});

plot.drawEquation( func, 'green', 1.5);



let res = solveIterative(0, func, 0.00001);
console.log(res);
console.log(func(res.x));

let table = createValuesTable(func);
buildTable(table);

let critPoints = getCriticalPoints(table);
console.log(critPoints);

let result = getRoots(critPoints,0.001, func);
console.log(result);

drawDiagram(critPoints[0], func);
writeRoots(result);
