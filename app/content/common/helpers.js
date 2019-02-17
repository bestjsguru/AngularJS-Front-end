'use strict';

export class Helpers {
    static pad(number, length) {
        let str = '' + number;
        
        while(str.length < length) {
            str = '0' + str;
        }
        
        return str;
    }
    
    static elementOffset(element) {
        let node = element;
        let left = node.offsetLeft;
        let top = node.offsetTop;
        
        node = node.parentNode;
        
        do {
            let styles = window.getComputedStyle(node);
            
            if (styles) {
                var position = styles.getPropertyValue('position');
                
                left -= node.scrollLeft;
                top -= node.scrollTop;
                
                if (/relative|absolute|fixed/.test(position)) {
                    left += parseInt(styles.getPropertyValue('border-left-width'), 10);
                    top += parseInt(styles.getPropertyValue('border-top-width'), 10);
                    
                    left += node.offsetLeft;
                    top += node.offsetTop;
                }
                
                node = position === 'fixed' ? null : node.parentNode;
            } else {
                node = node.parentNode;
            }
            
        } while (node instanceof Element);
        
        return { left: left, top: top };
    }
    
    static hexToRgba(hex, opacity) {
        hex = hex.replace('#', '');
        let r = parseInt(hex.substring(0, hex.length / 3), 16);
        let g = parseInt(hex.substring(hex.length / 3, 2 * hex.length / 3), 16);
        let b = parseInt(hex.substring(2 * hex.length / 3, 3 * hex.length / 3), 16);
        
        return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity / 100 + ')';
    }
    
    static shadeBlendConvert(p, from, to) {
        if(typeof(p) !== "number" || p < -1 || p > 1 || typeof(from) !== "string" || (from[0] !== 'r' && from[0] !== '#') || (to && typeof(to) !== "string"))return null; //ErrorCheck
        if(!this.sbcRip)this.sbcRip=(d)=>{
            let l=d.length,RGB={};
            if(l>9){
                d=d.split(",");
                if(d.length<3||d.length>4)return null;//ErrorCheck
                RGB[0]=i(d[0].split("(")[1]),RGB[1]=i(d[1]),RGB[2]=i(d[2]),RGB[3]=d[3]?parseFloat(d[3]):-1;
            }else{
                if(l === 8 || l === 6 || l < 4)return null; //ErrorCheck
                if(l<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(l>4?d[4]+""+d[4]:""); //3 or 4 digit
                d=i(d.slice(1),16),RGB[0]=d>>16&255,RGB[1]=d>>8&255,RGB[2]=d&255,RGB[3]=-1;
                if(l === 9 || l === 5)RGB[3]= r((RGB[2] / 255) * 10000) / 10000,RGB[2]=RGB[1],RGB[1]=RGB[0],RGB[0]= d >> 24 & 255;
            }
            return RGB;}
        var i=parseInt,r=Math.round,h=from.length>9,h= typeof(to) === "string" ? to.length > 9 ? true : to === "c" ? !h : false : h,b= p < 0,p= b ? p * -1 : p,to= to && to !== "c" ? to : b ? "#000000" : "#FFFFFF",f=this.sbcRip(from),t=this.sbcRip(to);
        if(!f||!t)return null; //ErrorCheck
        if(h)return "rgb"+(f[3]>-1||t[3]>-1?"a(":"(")+r((t[0]-f[0])*p+f[0])+","+r((t[1]-f[1])*p+f[1])+","+r((t[2]-f[2])*p+f[2])+(f[3]<0&&t[3]<0?")":","+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*10000)/10000:t[3]<0?f[3]:t[3])+")");
        else return "#"+(0x100000000+r((t[0]-f[0])*p+f[0])*0x1000000+r((t[1]-f[1])*p+f[1])*0x10000+r((t[2]-f[2])*p+f[2])*0x100+(f[3]>-1&&t[3]>-1?r(((t[3]-f[3])*p+f[3])*255):t[3]>-1?r(t[3]*255):f[3]>-1?r(f[3]*255):255)).toString(16).slice(1,f[3]>-1||t[3]>-1?undefined:-2);
    }
    
    static round(value, numberOfDecimals) {
        if(!_.isNumber(numberOfDecimals)) {
            numberOfDecimals = window.Auth.user.organisation.numberOfDecimals;
        }
        
        if(numberOfDecimals) {
            return Math.round(value * (numberOfDecimals = Math.pow(10, numberOfDecimals))) / numberOfDecimals;
        }
        
        return Math.round(value);
    }
    
    static toNumber(value) {
        if(!value && value !== 0) value = null;
        
        if(_.isString(value)) {
            value = Number(value.replace(/[^0-9\.-]+/g, ''));
        }
    
        return value;
    }
    
    static toNumberWithPrefixAndSuffix(value) {
        if(!value && value !== 0) value = null;
        
        let number = {
            value: value,
            prefix: '',
            suffix: '',
        };
        
        if(!_.isString(value)) return number;
        
        number.value = value.replace(/[^0-9\.-]+/g, '');
        
        // In case there is no number returned we convert it to NaN object
        if(number.value === '') number.value = NaN;
        
        value = value.replaceAll(',', '');
        number.value = Math.abs(number.value);
        
        let prefixSuffix = value.split(number.value);
        
        number.prefix = prefixSuffix.length === 2 ? prefixSuffix[0] : '';
        number.suffix = prefixSuffix.length === 2 ? prefixSuffix[1] : '';
        
        // Remove all zero characters from the beginning of suffix. This happens
        // because Math.abs() converts 18.10 to 18.1 and 0 is becoming a part of suffix
        number.suffix = _.trimStart(number.suffix, '0');
        
        number.value = Number(number.value);
        
        return number;
    }
    
    static formatDate(frequency, options = {}) {
        
        //if not a valid date, return original value instead of 'invalid date'
        let makeFormatter = (fn) => {
            return (date) => {
                if(_.isNull(date)) return date;
                
                return String(date).length > 1 && moment(new Date(date)).isValid() ? fn(date) : date;
            };
        };
        
        // If this is required for tooltop we always display full date
        if(options.isTooltip) frequency = 'Tooltip';
        
        let format = 'dddd, MMMM Do YYYY, HH:mm';
        
        let clonedFreq = _.clone(frequency) || '';
        
        switch(clonedFreq.toLowerCase()) {
            case 'hourly':
                format = 'HH:mm';
                if(options.isPieDonut) format = 'dddd, MMMM Do YYYY, HH:mm';
                if(options.isTable) format = 'MMMM Do YYYY, HH:mm';
                break;
            case 'daily':
                format = 'MMM Do';
                if(options.isPieDonut) format = 'dddd, MMMM Do YYYY';
                if(options.isTable) format = 'MMM Do YYYY';
                break;
            case 'weekly':
                format = 'MMM Do';
                if(options.withYear) format = 'MMM Do YYYY';
                break;
            case 'monthly':
                format = 'MMMM \'YY';
                break;
            case 'quarterly':
                format = '[Q]Q YYYY';
                break;
            case 'yearly':
                format = 'YYYY';
                break;
            case 'grain':
                format = 'MMMM Do YYYY, HH:mm:ss';
                break;
        }
        
        return makeFormatter((date) => moment(date).format(format));
    }
    
    static formatToDateString(date) {
        if(moment.isMoment(date)) {
            return date.format('YYYY-MM-DD');
        }
        
        return date.getFullYear() + '-' + Helpers.pad(date.getMonth() + 1, 2) + '-' + Helpers.pad(date.getDate(), 2);
    }
    
    static ordinalSuffixOf(i) {
        var j = i % 10,
            k = i % 100;
        if(j == 1 && k != 11) {
            return i + 'st';
        }
        if(j == 2 && k != 12) {
            return i + 'nd';
        }
        if(j == 3 && k != 13) {
            return i + 'rd';
        }
        return i + 'th';
    }
    
    static shouldBeFormatedAsDate(value, columnTitle) {
        let shouldBeFormatted = false;
        let stringsThatMightBeDates = ['date', 'Date', 'DoB'];
        let isString = typeof columnTitle === 'string';
        
        if(isString) {
            // If we have a column name, we will check by if it contains date parts
            stringsThatMightBeDates.forEach(str => {
                if(columnTitle.includesWord(str, [' ', '_']) && moment(value).isValid()) {
                    shouldBeFormatted = true;
                }
            });
            
            // case when we could have date format 'dd/MM/yyyy' and we are going to use date as string with this format
            let dateFormat = /[0-9]{2}[/][0-9]{2}[/][0-9]{4}$/;
            if(!stringsThatMightBeDates.includes(columnTitle) && dateFormat.test(value)) {
                shouldBeFormatted = false;
            }
            
        } else {
            // And if we dont have column, we will check if value is valid timestamp
            shouldBeFormatted = moment(value).isValid();
        }
        
        return shouldBeFormatted;
    }
    
    static shouldBeFormatedAsNumeric(value, columnTitle) {
        var shouldBeFormatted = true;
        var stringsToAvoid = [
            'sku', 'Sku', 'SKU',
            'code', 'Code', 'CODE',
            'barcode', 'Barcode', 'ID',
            'MemberId', 'memberId',
            'Telephone', 'telephone'
        ];
        
        var exactMatches = ['year', 'Year'];
        
        // We have to skip formatting if column titles contain any of above parts
        // If it does, its safe to say that value is required to stay in its original state
        columnTitle && stringsToAvoid.forEach(str => {
            if(columnTitle.includesWord(str, [' ', '_'])) shouldBeFormatted = false;
        });
        
        // Filter exact matches to title, becuase we can not check for parts in this cases.
        // For example 'Year' can be contained inside compare metric titles, and those
        // should be formatted as numeric values and not left in original state
        columnTitle && exactMatches.forEach(str => {
            if(columnTitle === str) shouldBeFormatted = false;
        });
        
        return shouldBeFormatted && !isNaN(value);
    }
    
    static genHash(value) {
        let str = JSON.stringify(value);
        let hash = 0, i, chr, len;
        if(str.length === 0) return hash;
        len = str.length;
        for(i = 0; i < len; i++) {
            chr = str.charCodeAt(i);
            hash = (hash << 5) - hash + chr; // jshint ignore:line
            // Convert to 32bit integer
            hash |= 0; // jshint ignore:line
        }
        return hash;
    }
    
    static toHHMMSS(time) {
        let isNegative = time < 0;
        
        let sec_num = parseInt(Math.abs(time), 10); // don't forget the second param
        
        let hours   = Math.floor(sec_num / 3600);
        let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        let seconds = sec_num - (hours * 3600) - (minutes * 60);
        
        hours = Helpers.pad(hours, 2);
        minutes = Helpers.pad(minutes, 2);
        seconds = Helpers.pad(seconds, 2);
        
        let number = [hours, minutes, seconds].join(':');
    
        if(isNegative) number = '-' + number;
        
        return number;
    }
    
    static get alphabet() {
        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    }
}
