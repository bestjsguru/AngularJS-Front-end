'use strict';

class DataService {
    constructor() {

    }

    correlation(A, B) {
        var res = this.covariance(A, B) / this.deviation(A) / this.deviation(B);
        return isNaN(res) ? 0 : res;
    }

    covariance(A, B) {
        var res = 0;
        var meanA = d3.mean(A);
        var meanB = d3.mean(B);
        res = d3.sum(A.map((a, idx) => (a - meanA) * (B[idx] - meanB)));
        return res / (A.length - 1);
    }

    deviation(data) {
        var v = this.variance(data);
        return v ? Math.sqrt(v) : v;
    }

    variance(data) {
        var n = data.length;
        var m = 0;
        var a;
        var d;
        var s = 0;
        var i = -1;
        var j = 0;

        while (++i < n) {
            a = data[i];
            d = a - m;
            m += d / ++j;
            s += d * (a - m);
        }

        if (j > 1) return s / (j - 1);
    }
}

truedashApp.service('DataService', DataService);
