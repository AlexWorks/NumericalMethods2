function func(x) {
    return Math.sqrt(x) + Math.sin(x);
}

function createValuesTable (n, lower, upper, func) {
    let result = [];

    let dx = (upper - lower) / n;
    const eps = 0.001;

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

/* Magic warning */
function getPolynom(table) {
    const n = table.length;
    let simplePolynoms = [];

    for (let i = 0; i < n; i++) {
        let k = 0;
        let simplePoly = [1];  // starting poly is: 1 * x^0
        let c_i = 1;

        /*
        *   Starting evaluate elementary polynoms
        * */
        for( let j = 0; j < n; j++) {
            if (i == j) continue;

            c_i *= table[i][0] - table[j][0];

            let helperPoly = simplePoly.slice();
            helperPoly.unshift(0);

            simplePoly.push(0);

            for ( let m = 1; m < simplePoly.length; m++) {
                simplePoly[m] += helperPoly[m] * (-table[j][0]);
            }


            k++;
        }
        for ( let j = 0; j < n; j++) {
            simplePoly[j] *= table[i][1] / c_i;
        }

        simplePolynoms.push(simplePoly);
    }

    /*
     *  Sum all the elementaru polynoms
     * */
    let poly = Array.from({length: n}).fill(0);

    for (let k = 0; k < n; k++) {
        for (let m = 0; m < n; m++) {
            poly[k] += simplePolynoms[m][k];
        }
    }

    let truePoly = Array.from({length: n}).fill(0);
    poly.forEach((item, i) => {
       truePoly[poly.length - i - 1] = poly[i];
    });

    return truePoly;
}

function getValueFromPoly(poly, x) {
    let result = 0;

    for (let i = 0; i < poly.length; i++) {
        result += poly[i] * Math.pow(x, i);
    }

    return result;
}

function getTableData(approx, func, n, lower, upper) {
    let results = [];
    let dx = (upper - lower) / n;
    let a = lower - dx;
    let b = upper + dx;
    let h = (upper - lower) / (4*n);
    const eps = 0.001;

    for(x = a; x <= b; x += h) {
        let resultItem = [];
        let trueRes = func(x);
        if (!isFinite(trueRes) || isNaN(trueRes)) continue;

        let approxRes = approx(x);

        resultItem.push(x);
        resultItem.push(trueRes);
        resultItem.push(approxRes);
        resultItem.push(Math.abs(trueRes - approxRes));
        resultItem.push((Math.abs(trueRes - approxRes) * 100 / trueRes));

        results.push(resultItem);
    }

    if (Math.abs(x - b) > eps) {
        results.pop();
        let resultItem = [];
        let trueRes = func(b);
        let approxRes = approx(b);

        resultItem.push(b);
        resultItem.push(trueRes);
        resultItem.push(approxRes);
        resultItem.push(Math.abs(trueRes - approxRes));
        resultItem.push((Math.abs(trueRes - approxRes) * 100 / trueRes));
    }

    return results;

}

function buildTable(tableData) {
    let table = document.createElement('table');
    table.className = 'results-table';

    let row = document.createElement('tr');
    let headings = ['x', 'f(x)','φ(x)', 'diff', 'diff percentage'];

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
                case 1: case 2: case 3:
                    td.innerHTML = tableData[i][j].toPrecision(6);
                    break;
                case 4:
                    td.innerHTML = tableData[i][j].toFixed(2) + '%';
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

function writePoly(poly) {
    document.writeln('Polynom is:');
    document.write('<br>');
    for (let i = 0; i < poly.length; i++) {
        document.writeln('x^' + i + ': ' + poly[i]);
        document.write('<br>');
    }
}

/*
 *   For drawing plots
 * */
function Plot(config) {
    this.canvas = document.getElementById(config.canvas);
    this.minX = config.minX;
    this.minY = config.minY;
    this.maxX = config.maxX;
    this.maxY = config.maxY;
    this.unitsPerTick = config.unitsPerTick;

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

    var xPosInc = this.unitsPerTick * this.unitX;
    var xPos, unit;
    context.font = this.font;
    context.textAlign = 'center';
    context.textBaseline = 'top';

    xPos = this.centerX - xPosInc;
    unit = -1 * this.unitsPerTick;

    while (xPos > 0) {
        context.moveTo(xPos, this.centerY - this.tickSize / 2);
        context.lineTo(xPos, this.centerY + this.tickSize / 2);
        context.stroke();
        context.fillText(unit, xPos, this.centerY + this.tickSize + 3);
        unit -= this.unitsPerTick;
        xPos = Math.round(xPos - xPosInc);
    }

    xPos = this.centerX + xPosInc;
    unit = this.unitsPerTick;
    while(xPos < this.canvas.width) {
        context.moveTo(xPos, this.centerY - this.tickSize / 2);
        context.lineTo(xPos, this.centerY + this.tickSize / 2);
        context.stroke();
        context.fillText(unit, xPos, this.centerY + this.tickSize / 2 + 3);
        unit += this.unitsPerTick;
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
    var yPosIncrement = this.unitsPerTick * this.unitY;
    var yPos, unit;
    context.font = this.font;
    context.textAlign = 'right';
    context.textBaseline = 'middle';

    // draw top tick marks
    yPos = this.centerY - yPosIncrement;
    unit = this.unitsPerTick;
    while(yPos > 0) {
        context.moveTo(this.centerX - this.tickSize / 2, yPos);
        context.lineTo(this.centerX + this.tickSize / 2, yPos);
        context.stroke();
        context.fillText(unit, this.centerX - this.tickSize / 2 - 3, yPos);
        unit += this.unitsPerTick;
        yPos = Math.round(yPos - yPosIncrement);
    }

    // draw bottom tick marks
    yPos = this.centerY + yPosIncrement;
    unit = -1 * this.unitsPerTick;
    while(yPos < this.canvas.height) {
        context.moveTo(this.centerX - this.tickSize / 2, yPos);
        context.lineTo(this.centerX + this.tickSize / 2, yPos);
        context.stroke();
        context.fillText(unit, this.centerX - this.tickSize / 2 - 3, yPos);
        unit -= this.unitsPerTick;
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

console.log(func(0));

const lowerBound = 0;
const upperBound = 6;
const n = 20;

let table = createValuesTable(n,lowerBound,upperBound, func);

console.log(table);

let poly = getPolynom(table);

console.log(poly);

let approximated = getValueFromPoly.bind(null, poly);


let plot = new Plot({
    unitsPerTick: 1,
    minX: -10,
    maxX: 10,
    minY: -10,
    maxY: 10,
    canvas: 'functionPlot'
});

let data = getTableData(approximated, func, n, lowerBound, upperBound);
buildTable(data);
writePoly(poly);



plot.drawEquation( func, 'green', 1.5);
plot.drawEquation( approximated, 'red', 1.5);

