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

function func(x) {
    return Math.sqrt(x) + Math.sin(x);
}

function getValueFromPoly(poly, x) {
    let result = 0;

    for (let i = 0; i < poly.length; i++) {
        result += poly[i] * Math.pow(x, i);
    }

    return result;
}

function createValuesTable (n, lower, upper, func) {
    let result = [];

    let dx = (upper - lower) / n;
    const eps = 0.001;

    let x;

    for(x = lower; x <= upper; x += dx) {
        let res = func(x);
        if ( isNaN(res) || !isFinite(res))  continue;

        result.push([x, func(x)]);
    }


    if ( x - upper < eps) {
        result.push([upper, func(upper)]);
    }


    if (Math.abs(x - upper) > eps) {
        result.pop();
        result.push([upper, func(upper)]);
    }

    console.log(result);
    return result;
}

function cubicSplineSystem(table, left, right, derivative) {
    // Fill system with zeros
    let matrix = [];
    for (let i = 0; i < 4 * (table.length - 1); i++) {
        matrix[i] = Array.from({length: 4 * (table.length - 1)}).fill(0);
    }

    let rightSide = Array.from({length: 4 * (table.length - 1)}).fill(0);

    let system = {
        matrix,
        rightSide
    };

   let equationCounter = 0;

   // First 2(n - 1) equations
   for (let i = 0; i < table.length - 1; i++) {

       for (let j = 0; j < 4; j++) {
           system.matrix[equationCounter][i * 4 + j] = Math.pow(table[i][0], 3 - j);
       }
       system.rightSide[equationCounter] = table[i][1];
       equationCounter++;

       for (let j = 0; j < 4; j++) {
           system.matrix[equationCounter][i * 4 + j] = Math.pow(table[i + 1][0], 3 - j);
       }
       system.rightSide[equationCounter] = table[i+1][1];
       equationCounter++;
   }

   // Another 2( n - 2) equations
   for (let i = 1; i < table.length - 1; i++) {
        for (let j = 0; j < 3; j++) {
            system.matrix[equationCounter][(i - 1) * 4 + j] = (3 - j) * Math.pow(table[i][0], 2 - j);
        }

        for (let j = 0; j < 3; j++) {
            system.matrix[equationCounter][i * 4 + j] = (j - 3) * Math.pow(table[i][0], 2 - j);
        }
        equationCounter++;
    }

    for (let i = 1; i < table.length - 1; i++) {
        for (let j = 0; j < 2; j++) {
            let mul = (j)? 6 : 2;
            system.matrix[equationCounter][(i - 1) * 4 + j] = Math.pow(table[i][0], 1 - j) * mul;
        }

        for (let j = 0; j < 2; j++) {
            let mul = (j)? 6 : 2;
            system.matrix[equationCounter][i * 4 + j] = -Math.pow(table[i][0], 1 - j) * mul;
        }
        equationCounter++;
    }


    // Last two equations - edge conditions
    if (derivative === "second") {
        system.matrix[equationCounter][0] = 6 * table[0][0];
        system.matrix[equationCounter][1] = 2;
        system.rightSide[equationCounter] = left;
        equationCounter++;
        system.matrix[equationCounter][4 * (table.length - 2)] = 6 * table[(table.length - 1)][0];
        system.matrix[equationCounter][4 * (table.length - 2) + 1] = 2;
        system.rightSide[equationCounter] = right;
    }

    if (derivative === "first") {
       system.matrix[equationCounter][0] = 3 * table[0][0] * table[0][0];
       system.matrix[equationCounter][1] = 2 * table[0][0];
       system.matrix[equationCounter][2] = 1;
       system.rightSide[equationCounter] = left;
       equationCounter++;
        system.matrix[equationCounter][4 * (table.length - 2)] = 3 * table[(table.length - 1)][0] * table[(table.length - 1)][0];
        system.matrix[equationCounter][4 * (table.length - 2) + 1] = 2 * table[(table.length - 1)][0];
        system.matrix[equationCounter][4 * (table.length - 2) + 2] = 1;
        system.rightSide[equationCounter] = right;
    }

    document.write(derivative + ' derivative: left = ' + leftEdge.toPrecision(5) + '  right = ' + rightEdge.toPrecision(5) + '<br>');
    return system;
}

function evaluateFromCubicSpline(spline,  lower, upper, x) {
    let n = spline.length / 4;
    let splineNumber = n * (x - lower) / (upper - lower);

    if (splineNumber < 0) {
        splineNumber = 0;
    }
    if (splineNumber >= n) {
        splineNumber = n - 1;
    }

    splineNumber = Math.floor(splineNumber);
    let res = 0;

    for (let i = 0; i < 4; i++) {
        res += spline[splineNumber * 4 + i] * Math.pow (x, 3 - i);
    }

    return res;
}

function printCubicSpline(spline) {
    document.write( 'left bound = ' + lowerBound + ' , right bound = ' + upperBound + '<br>');
    let counter = 0;
    while (counter < spline.length / 4) {
        let res = counter + ': ';
        for (let j = 0; j < 4; j++) {
            res += spline[counter * 4 + j].toPrecision(5) + '*' + 'x^' + (3 - j) + ' ';
            if (j != 3) {
                res += '+ ';
            }
        }
        document.write(res);
        document.write('<br>');
        counter++;
    }
}

/*
*   Не метод прогонки :(
* */
function gaussMethod(system) {

    let matrix = deepCloneArray(system.matrix);
    let rightSide = deepCloneArray(system.rightSide);
    let roots = Array.from({length: matrix.length}).fill(0);
    const eps = 0.0001;



    for ( let i = 0; i < matrix.length; i++) {

        if (Math.abs(matrix[i][i]) < eps) {
            for (let k = i + 1; k < matrix.length; k++) {
                if ( Math.abs(matrix[k][i]) > eps) {
                    let temp = matrix[i].slice();
                    matrix[i] = matrix[k].slice();
                    matrix[k] = temp;

                    temp = rightSide[i];
                    rightSide[i] = rightSide[k];
                    rightSide[k] = temp;

                    break;

                }
                if ( k === matrix.length - 1) {
                    console.log("Sorry m9 :(");
                }
            }
        }

        for (let j = i + 1; j < matrix.length; j++) {

            let multiplier = matrix[j][i] / matrix[i][i];

            for (let k = i; k < matrix.length; k++) {
                matrix[j][k] -= matrix[i][k] * multiplier;
            }
            rightSide[j] -= rightSide[i] * multiplier;
        }
    }

    roots[matrix.length - 1] = rightSide[matrix.length - 1] / matrix[matrix.length - 1][matrix.length - 1];

    for (let i = matrix.length - 2; i >= 0; i--) {
        let s = 0;

        for (let j = i + 1; j < matrix.length; j++) {
            s += matrix[i][j] * roots[j];
        }
        roots[i] = (rightSide[i] - s) / matrix[i][i];
    }

    return roots;
}

function deepCloneArray(array) {
    let copy = [];

    for (let item in array) {
        if ( typeof array[item] == "object") {
            copy[item] = deepCloneArray(array[item]);
        } else {
            copy[item] = array[item];
        }
    }
    return copy;
}

/* Ez function for derivative*/
function getDerivative(func, x , h) {
    let first = func(x - h);
    let second = func(x + h);

    if (!isFinite(first) || isNaN(first)) {
        return 0;
    }
    if (!isFinite(second) || isNaN(second)) {
        return 0;
    }

    if ( first === second) {
        return NaN;
    }

    return (second - first) / (2 * h);
}

function maxError( func, approxFunc, n, lower, upper) {
    let h = (upper - lower) / (4*n);
    let max = 0;
    let coord = lower;
    let eps = 0.0001;
    let x;
    for (x = lower; x <= upper; x += h) {
        if ( Math.abs(func(x) - approxFunc(x)) > max) {
            max = Math.abs(func(x) - approxFunc(x));
            coord = x.toPrecision(6);
        }
    }

    if ( x - upper < eps) {
        if (Math.abs(func(x) - approxFunc(x)) > max) {
            max = Math.abs(func(x) - approxFunc(x));
            coord = x.toPrecision(6);
        }
    }

    document.write('Max error at x = ' + coord + " , value = " + max + '<br>');
}

// Input data
const lowerBound = 0;
const upperBound = 6;
const leftEdge = 0 //getDerivative(func, lowerBound, 0.001);
const rightEdge = 0 //getDerivative(func, upperBound, 0.001);

console.log(leftEdge, rightEdge);
const n = 6;
const table = createValuesTable(n, lowerBound, upperBound, func);

let system = cubicSplineSystem(table, leftEdge, rightEdge, "second");

console.log(system);

let spline = gaussMethod(system);

console.log(spline);

let splineFunc = evaluateFromCubicSpline.bind(null,spline, lowerBound, upperBound);

/*
let testPoly = [];
testPoly.push(spline[15], spline[14], spline[13], spline[12]);
console.log(testPoly);
let test = getValueFromPoly.bind(null, testPoly);
*/


printCubicSpline(spline);
maxError(func, splineFunc, n, lowerBound, upperBound);

let plot = new Plot({
    unitsPerTick: 1,
    minX: -10,
    maxX: 10,
    minY: -10,
    maxY: 10,
    canvas: 'functionPlot'
});

plot.drawEquation( func, 'green', 1.5);
plot.drawEquation( splineFunc, 'red', 1.5);
