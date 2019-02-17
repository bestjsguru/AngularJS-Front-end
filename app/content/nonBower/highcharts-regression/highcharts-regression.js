'use strict';

(function(factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory;
    } else {
        factory(Highcharts);
    }
}(function(Highcharts) {

    /* Code extracted from https://github.com/Tom-Alexander/regression-js/

     Modifications of January 5, 2015

     - Add dashStyle ('' by default)

     */

    (function (H) {


        H.wrap(H.Chart.prototype, 'init', function (proceed) {
            let series = arguments[1].series;
            let extraSeries = [];
            for (let i = 0; i < series.length; i++){
                let s = series[i];
                if ( s.regression && !s.rendered ) {
                    s.regressionSettings =  s.regressionSettings || {};
                    s.regressionSettings.tooltip = s.regressionSettings.tooltip || {};
                    s.regressionSettings.dataLabels = s.regressionSettings.dataLabels || {};
                    s.regressionSettings.dashStyle = s.regressionSettings.dashStyle || 'solid';
                    s.regressionSettings.decimalPlaces = s.regressionSettings.decimalPlaces || 2;
                    s.regressionSettings.useAllSeries = s.regressionSettings.useAllSeries || false;

                    let regressionType = s.regressionSettings.type || "linear";
                    let regression;
                    let extraSerie = {
                        data:[],
                        yAxis: s.yAxis ,
                        lineWidth: s.regressionSettings.lineWidth || 2,
                        marker: {enabled: false} ,
                        isRegressionLine: true,
                        visible: s.regressionSettings.visible,
                        type: s.regressionSettings.linetype || 'spline',
                        name: s.regressionSettings.name || "Equation: %eq",
                        id: s.regressionSettings.id,
                        color: s.regressionSettings.color || s.color,
                        dashStyle: s.regressionSettings.dashStyle || 'solid',
                        showInLegend: s.regressionSettings.showInLegend,
                        tooltip: s.regressionSettings.tooltip,
                        dataLabels: s.regressionSettings.dataLabels,
                    };

                    let mergedData = s.data;
                    if (s.regressionSettings.useAllSeries) {
                        mergedData = [];
                        for (let di = 0; di < series.length; di++) {
                            let seriesToMerge = series[di];
                            mergedData = mergedData.concat(seriesToMerge.data);
                        }
                    }

                    if (regressionType == "linear") {
                        let extrapolate = s.regressionSettings.extrapolate || 0;
                        regression = _linear(mergedData,s.regressionSettings.decimalPlaces, extrapolate);
                        extraSerie.type = "line";
                    }else if (regressionType == "exponential") {
                        regression = _exponential(mergedData);
                    }
                    else if (regressionType == "polynomial"){
                        let order = s.regressionSettings.order || 2;
                        let extrapolate = s.regressionSettings.extrapolate || 0;
                        regression = _polynomial(mergedData, order, extrapolate);
                    }else if (regressionType == "logarithmic"){
                        regression = _logarithmic(mergedData);
                    }else if (regressionType == "loess"){
                        let loessSmooth = s.regressionSettings.loessSmooth || 25;
                        regression = _loess(mergedData, loessSmooth/100);
                    }else {
                        console.error("Invalid regression type: " , regressionType);
                        break;
                    }


                    regression.rSquared =  coefficientOfDetermination(mergedData, regression.points);
                    regression.rValue = Math.sqrt(regression.rSquared).toFixed(s.regressionSettings.decimalPlaces);
                    regression.rSquared = regression.rSquared.toFixed(s.regressionSettings.decimalPlaces);
                    regression.standardError = standardError(mergedData, regression.points).toFixed(s.regressionSettings.decimalPlaces);
                    extraSerie.data = regression.points;
                    extraSerie.name = extraSerie.name.replace("%r2",regression.rSquared);
                    extraSerie.name = extraSerie.name.replace("%r",regression.rValue);
                    extraSerie.name = extraSerie.name.replace("%eq",regression.string);
                    extraSerie.name = extraSerie.name.replace("%se", regression.standardError);

                    if(extraSerie.visible === false){
                        extraSerie.visible = false;
                    }

                    extraSerie.regressionOutputs = regression;
                    extraSeries.push(extraSerie);
                    arguments[1].series[i].rendered = true;
                }
            }


            arguments[1].series = series.concat(extraSeries);

            proceed.apply(this, Array.prototype.slice.call(arguments, 1));


        });



        /**
         * Code extracted from https://github.com/Tom-Alexander/regression-js/
         */
        function _exponential(data) {
            let sum = [0, 0, 0, 0, 0, 0], n = 0, results = [];

            for (let len = data.length; n < len; n++) {
                if (data[n].x != null) {
                    data[n][0] = data[n].x;
                    data[n][1] = data[n].y;
                }
                if (data[n][1] != null) {
                    sum[0] += data[n][0]; // X
                    sum[1] += data[n][1]; // Y
                    sum[2] += data[n][0] * data[n][0] * data[n][1]; // XXY
                    sum[3] += data[n][1] * Math.log(data[n][1]); // Y Log Y
                    sum[4] += data[n][0] * data[n][1] * Math.log(data[n][1]); //YY Log Y
                    sum[5] += data[n][0] * data[n][1]; //XY
                }
            }

            let denominator = sum[1] * sum[2] - sum[5] * sum[5];
            let A = Math.pow(Math.E, (sum[2] * sum[3] - sum[5] * sum[4]) / denominator);
            let B = (sum[1] * sum[4] - sum[5] * sum[3]) / denominator;

            for (let i = 0, len = data.length; i < len; i++) {
                let coordinate = [data[i][0], A * Math.pow(Math.E, B * data[i][0])];
                results.push(coordinate);
            }

            results.sort(function(a,b){
                if(a[0] > b[0]){ return 1;}
                if(a[0] < b[0]){ return -1;}
                return 0;
            });

            let string = 'y = ' + Math.round(A*100) / 100 + 'e^(' + Math.round(B*100) / 100 + 'x)';

            return {equation: [A, B], points: results, string: string};
        }


        /**
         * Code extracted from https://github.com/Tom-Alexander/regression-js/
         * Human readable formulas:
         *
         *              N * Σ(XY) - Σ(X)
         * intercept = ---------------------
         *              N * Σ(X^2) - Σ(X)^2
         *
         * correlation = N * Σ(XY) - Σ(X) * Σ (Y) / √ (  N * Σ(X^2) - Σ(X) ) * ( N * Σ(Y^2) - Σ(Y)^2 ) ) )
         *
         */
        function _linear(data, decimalPlaces, extrapolate) {
            let sum = [0, 0, 0, 0, 0], n = 0, results = [], N = data.length;

            for (; n < data.length; n++) {
                if (data[n].x != null) {
                    data[n][0] = data[n].x;
                    data[n][1] = data[n].y;
                }
                if (data[n][1] != null) {
                    sum[0] += data[n][0]; //Σ(X)
                    sum[1] += data[n][1]; //Σ(Y)
                    sum[2] += data[n][0] * data[n][0]; //Σ(X^2)
                    sum[3] += data[n][0] * data[n][1]; //Σ(XY)
                    sum[4] += data[n][1] * data[n][1]; //Σ(Y^2)
                } else {
                    N -= 1;
                }
            }

            let gradient = (N * sum[3] - sum[0] * sum[1]) / (N * sum[2] - sum[0] * sum[0]);
            let intercept = sum[1] / N - gradient * sum[0] / N;
            // let correlation = (N * sum[3] - sum[0] * sum[1]) / Math.sqrt((N * sum[2] - sum[0] * sum[0]) * (N * sum[4] - sum[1] * sum[1]));


            for (let i = 0, len = data.length; i < len; i++) {
                let coorY = data[i][0] * gradient + intercept;
                if (decimalPlaces) {
                    coorY = parseFloat(coorY.toFixed(decimalPlaces));
                }
                let coordinate = [data[i][0], coorY];
                results.push(coordinate);
            }
            results.sort(function(a,b){
                if(a[0] > b[0]){ return 1;}
                if(a[0] < b[0]){ return -1;}
                return 0;
            });
    
            // Extrapolate if needed
            if(data.length) {
                let isPercent = String(extrapolate).endsWith('%');
                let numberOfExtrapolatePoints = Math.max(0, isPercent ? Math.round(data.length * (extrapolate.replace('%', '') / 100)) : extrapolate);
                let xAxisStep = data[data.length - 1][0] - data[data.length - 2][0];
                let yAxisStep = results[results.length - 1][1] - results[results.length - 2][1];
                let lastValue = results[results.length - 1];
        
                for (let i = 0, len = numberOfExtrapolatePoints; i < len; i++) {
                    let coordinate = [lastValue[0] + xAxisStep * (i+1), lastValue[1] + yAxisStep * (i+1)];
                    results.push(coordinate);
                }
            }

            let string = 'y = ' + Math.round(gradient*100) / 100 + 'x + ' + Math.round(intercept*100) / 100;
            return {equation: [gradient, intercept], points: results, string: string};
        }

        /**
         *  Code extracted from https://github.com/Tom-Alexander/regression-js/
         */
        function _logarithmic(data) {
            let sum = [0, 0, 0, 0], n = 0, results = [];


            for (let len = data.length; n < len; n++) {
                if (data[n].x != null) {
                    data[n][0] = data[n].x;
                    data[n][1] = data[n].y;
                }
                if (data[n][1] != null) {
                    sum[0] += Math.log(data[n][0]);
                    sum[1] += data[n][1] * Math.log(data[n][0]);
                    sum[2] += data[n][1];
                    sum[3] += Math.pow(Math.log(data[n][0]), 2);
                }
            }

            let B = (n * sum[1] - sum[2] * sum[0]) / (n * sum[3] - sum[0] * sum[0]);
            let A = (sum[2] - B * sum[0]) / n;

            for (let i = 0, len = data.length; i < len; i++) {
                let coordinate = [data[i][0], A + B * Math.log(data[i][0])];
                results.push(coordinate);
            }

            results.sort(function(a,b){
                if(a[0] > b[0]){ return 1;}
                if(a[0] < b[0]){ return -1;}
                return 0;
            });

            let string = 'y = ' + Math.round(A*100) / 100 + ' + ' + Math.round(B*100) / 100 + ' ln(x)';

            return {equation: [A, B], points: results, string: string};
        }
    
        /**
         * Code extracted from https://github.com/Tom-Alexander/regression-js/
         */
        function _power(data) {
            var sum = [0, 0, 0, 0], n = 0, results = [];
        
            for (len = data.length; n < len; n++) {
                if (data[n].x != null) {
                    data[n][0] = data[n].x;
                    data[n][1] = data[n].y;
                }
                if (data[n][1] != null) {
                    sum[0] += Math.log(data[n][0]);
                    sum[1] += Math.log(data[n][1]) * Math.log(data[n][0]);
                    sum[2] += Math.log(data[n][1]);
                    sum[3] += Math.pow(Math.log(data[n][0]), 2);
                }
            }
        
            var B = (n * sum[1] - sum[2] * sum[0]) / (n * sum[3] - sum[0] * sum[0]);
            var A = Math.pow(Math.E, (sum[2] - B * sum[0]) / n);
        
            for (var i = 0, len = data.length; i < len; i++) {
                var coordinate = [data[i][0], A * Math.pow(data[i][0] , B)];
                results.push(coordinate);
            }
        
            results.sort(function(a,b){
                if(a[0] > b[0]){ return 1;}
                if(a[0] < b[0]){ return -1;}
                return 0;
            });
        
            var string = 'y = ' + Math.round(A*100) / 100 + 'x^' + Math.round(B*100) / 100;
        
            return {equation: [A, B], points: results, string: string};
        }

        /**
         * Code extracted from https://github.com/Tom-Alexander/regression-js/
         */
        function _polynomial(data, order, extrapolate) {
            if(typeof order == 'undefined'){
                order =2;
            }
            let lhs = [], rhs = [], results = [], a = 0, b = 0, i = 0, k = order + 1;

            for (; i < k; i++) {
                for (let l = 0, len = data.length; l < len; l++) {
                    if (data[l].x != null) {
                        data[l][0] = data[l].x;
                        data[l][1] = data[l].y;
                    }
                    if (data[l][1] != null) {
                        a += Math.pow(data[l][0], i) * data[l][1];
                    }
                }
                lhs.push(a);
                a = 0;
                let c = [];
                for (let j = 0; j < k; j++) {
                    for (let l = 0, len = data.length; l < len; l++) {
                        if (data[l][1]) {
                            b += Math.pow(data[l][0], i + j);
                        }
                    }
                    c.push(b);
                    b = 0;
                }
                rhs.push(c);
            }
            rhs.push(lhs);

            let equation = gaussianElimination(rhs, k);

            let resultLength = data.length + extrapolate;
            let step = data[data.length - 1][0] - data[data.length - 2][0];
            for (let i = 0, len = resultLength; i < len; i++) {
                let answer = 0;
                let x;
                if(typeof data[i] !== 'undefined') {
                    x = data[i][0];
                } else {
                    x = data[data.length - 1][0] + (i - data.length) * step;
                }

                for (let w = 0; w < equation.length; w++) {
                    answer += equation[w] * Math.pow(x, w);
                }
                results.push([x, answer]);
            }

            results.sort(function(a,b){
                if(a[0] > b[0]){ return 1;}
                if(a[0] < b[0]){ return -1;}
                return 0;
            });

            let string = 'y = ';

            for(let i = equation.length-1; i >= 0; i--){
                if(i > 1) {
                    string += Math.round(equation[i] * 100) / 100 + 'x^' + i + ' + ';
                } else if (i == 1) {
                    string += Math.round(equation[i] * 100) / 100 + 'x' + ' + ';
                } else {
                    string += Math.round(equation[i] * 100) / 100;
                }
            }

            return {equation: equation, points: results, string: string};
        }

        /**
         * @author: Ignacio Vazquez
         * Based on
         * - http://commons.apache.org/proper/commons-math/download_math.cgi LoesInterpolator.java
         * - https://gist.github.com/avibryant/1151823
         */
        function _loess (data, bandwidth) {
            bandwidth = bandwidth || 0.25 ;
    
            var xval = data.map(function(pair){return pair[0];});
            var distinctX =  array_unique(xval) ;
            if (  2 / distinctX.length  > bandwidth ) {
                bandwidth = Math.min( 2 / distinctX.length, 1 );
                console.warn("updated bandwith to "+ bandwidth);
            }
    
            var yval = data.map(function(pair){return pair[1];});
    
            function array_unique(values) {
                var o = {}, i, l = values.length, r = [];
                for(i=0; i<l;i+=1) o[values[i]] = values[i];
                for(i in o) r.push(o[i]);
                return r;
            }
    
            function tricube(x) {
                var tmp = 1 - x * x * x;
                return tmp * tmp * tmp;
            }
    
            var res = [];
    
            var left = 0;
            var right = Math.floor(bandwidth * xval.length) - 1;
    
            for(var i in xval)
            {
                var x = xval[i];
        
                if (i > 0) {
                    if (right < xval.length - 1 &&
                        xval[right+1] - xval[i] < xval[i] - xval[left]) {
                        left++;
                        right++;
                    }
                }
                //console.debug("left: "+left  + " right: " + right );
                var edge;
                if (xval[i] - xval[left] > xval[right] - xval[i])
                    edge = left;
                else
                    edge = right;
                var denom = Math.abs(1.0 / (xval[edge] - x));
                var sumWeights = 0;
                var sumX = 0, sumXSquared = 0, sumY = 0, sumXY = 0;
        
                var k = left;
                while(k <= right)
                {
                    var xk = xval[k];
                    var yk = yval[k];
                    var dist;
                    if (k < i) {
                        dist = (x - xk);
                    } else {
                        dist = (xk - x);
                    }
                    var w = tricube(dist * denom);
                    var xkw = xk * w;
                    sumWeights += w;
                    sumX += xkw;
                    sumXSquared += xk * xkw;
                    sumY += yk * w;
                    sumXY += yk * xkw;
                    k++;
                }
        
                var meanX = sumX / sumWeights;
                //console.debug(meanX);
                var meanY = sumY / sumWeights;
                var meanXY = sumXY / sumWeights;
                var meanXSquared = sumXSquared / sumWeights;
        
                var beta;
                if (meanXSquared == meanX * meanX)
                    beta = 0;
                else
                    beta = (meanXY - meanX * meanY) / (meanXSquared - meanX * meanX);
        
                var alpha = meanY - beta * meanX;
                res[i] = beta * x + alpha;
            }
            //console.debug(res);
            return {
                equation: "" ,
                points: xval.map(function(x,i){return [x, res[i]];}),
                string:""
            } ;
        }


        /**
         * Code extracted from https://github.com/Tom-Alexander/regression-js/
         */
        function  gaussianElimination(a, o) {
            let j = 0, k = 0, maxrow = 0, tmp = 0, n = a.length - 1, x = new Array(o);
            for (let i = 0; i < n; i++) {
                maxrow = i;
                for (j = i + 1; j < n; j++) {
                    if (Math.abs(a[i][j]) > Math.abs(a[i][maxrow])) {
                        maxrow = j;
                    }
                }
                for (k = i; k < n + 1; k++) {
                    tmp = a[k][i];
                    a[k][i] = a[k][maxrow];
                    a[k][maxrow] = tmp;
                }
                for (j = i + 1; j < n; j++) {
                    for (k = n; k >= i; k--) {
                        a[k][j] -= a[k][i] * a[i][j] / a[i][i];
                    }
                }
            }
            for (j = n - 1; j >= 0; j--) {
                tmp = 0;
                for (k = j + 1; k < n; k++) {
                    tmp += a[k][j] * x[k];
                }
                x[j] = (a[n][j] - tmp) / a[j][j];
            }
            return x;
        }

        /**
         * @author Ignacio Vazquez
         * See http://en.wikipedia.org/wiki/Coefficient_of_determination for theaorical details
         */
        function coefficientOfDetermination (data, pred ) {

            let SSYY = 0;
            let SSE = 0;
            let mean = 0;
            let N = data.length;

            // Sort the initial data { pred array (model's predictions) is sorted  }
            // The initial data must be sorted in the same way in order to calculate the coefficients
            data.sort(function(a,b){
                if(a[0] > b[0]){ return 1;}
                if(a[0] < b[0]){ return -1;}
                return 0;
            });

            // Calc the mean
            for (let i = 0; i < data.length; i++ ){
                if (data[i][1] != null) {
                    mean += data[i][1];
                } else {
                    N--;
                }
            }
            mean /= N;

            // Calc the coefficent of determination
            for (let i = 0; i < data.length; i++ ){
                if (data[i][1] != null) {
                    SSYY +=  Math.pow( data[i][1] -  pred[i][1] , 2);
                    SSE +=  Math.pow( data[i][1] -  mean , 2);
                }
            }
            return  1 - SSYY / SSE ;
        }

        function standardError(data, pred) {
            let SE = 0, N = data.length;

            for (let i = 0; i < data.length; i++ ) {
                if (data[i][1] != null) {
                    SE += Math.pow(data[i][1] - pred[i][1], 2);
                } else {
                    N--;
                }
            }
            SE = Math.sqrt(SE / (N-2));

            return SE;
        }



    }(Highcharts));

}));
