export class DatatableCellModel{

    constructor(metricValue, comparableValue, formatter = angular.identity) {
        this.metricValue = metricValue;
        this.comparableValue = comparableValue;
        this.formatFunc = formatter;

        this.format();
    }

    format(){
        this.comparableFormatted = this.formatFunc(this.comparableValue);
        this.metricFormatted = this.formatFunc(this.metricValue);
        this.difference = this.formatFunc(Math.abs(this.metricValue - this.comparableValue));
        if (this.metricValue - this.comparableValue < 0)
            this.type = 'lower';
        else if (this.metricValue - this.comparableValue > 0)
            this.type = 'higher';
        else
            this.type = 'neutral';

        if (this.metricValue && this.comparableValue) {
            this.percentage = this.metricValue / this.comparableValue * 100;
            this.percentage -= 100;
            this.percentage = +this.percentage.toFixed(2);
            this.percentage += '%';
        } else {
            this.percentage = false;
        }
    }
}
