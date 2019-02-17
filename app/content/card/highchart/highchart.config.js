'use strict';

export default {
    marker: {
        radius: 5,
        triangle: {
            red: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAVlpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KTMInWQAAAklJREFUKBVtU89rE0EUfjOz2TRJJY1II7UpQsHGehQUNG0XjYdKrFAp/jh6qPgH1EPbg+LJk3cP/iGCGO2td6VGFDSYRKEJTUyymd2d53tTV0Qd2P3mfe978+28xwL8tfAhSKa+rZzPtyqlbUaOY5738bLCOLD4dk0wRlHiaf5I+jHjn7zd/+/1yvMc5htXLyzur17C1o0rmpFj5uM87/9ZCGBdm9eWdg4WZ/HrLPiMzZWlHRbH+bjw92cjuVIltlYv3xwP+iVdvqXTW8+ULt/W47pfYp7zrIuLLcYnEir61HftOUC/9l4jovE/1EbtU3Qo8Zznglh/6Ox5lmxVLt6fSDinB0MIjD/knDDDgeKYec5bt196ySMQ1Wr4sXw2K1BsDYwB0aNxGWPvj5ERHA8M+SFst9fKWdZznYSqZ90zydRGznWOa2MCSIKKul1Sk77XNRxrEwU5N5H3/eED60519vT9ZW9aq3BPCZGJAAwEIyknC0ZMFRAbdWG+1yUkkobuJiPEgdGyeOLFGyJpaSfczCacjGFXd0xibRdTd+6aY4+eACPHzHOedGnpRptcJ5vLC/M0gHsHQchTViAk4CcAZzKPwnUlI8fMc97qANab1xfm1UZx5nlKqbkQcWQVhjozPYFRu4ujL5+j0euXwoz5IJSDZMKGAekTYYgnRbNSalMjctSowz+C01IBdhqA9T0QhSKI3BR1grpBy9DjUp87Oug4UgqvHehzNCZNJ9sGAtAVjs4AFM4A9HsAft8W2pcQ+EOErpJy9yc7phuhNys2CQAAAABJRU5ErkJggg==)',
            green: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAVlpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KTMInWQAAAlNJREFUKBVdUs9LVFEUPufe92beOI5GSRq5SBBK0yILCbWYTdt2Eq2DYiCRChNMaKC9bltEf0D+B20KaiGhI9Evi8pIWmajkzPz5r57T+dcZsS88Djv+8733e+8ex/AwUVFJdTQ8nT38Mqd+aF3091e0uT3y71wPzEJH1Cw0riY6e96pOq4KLjFy3tr/WfOvygGS7hkB0rTl6NU6nrwrWykChZe+i2jVJ+yRxAhINLIyt1XpchMwO5ODNmO9Eg9fF26sHAJmv2Wfi/Z78rGi6sz13634cQsDjQed13VUgULLxsfTAeg5gTPJvXY6sxHWLtB6+XvDSJyn7c3YsGe575Pbep9ch6Knhzu6y3ojmgAYmNqriE9rNpYCxZe+mJu6RUUi+olFpPzK7OdnP+AaoYnsco568/DSmXseaB50YlefCr/EHy6wXgm6Ix6nLHsRr2d/CVJ2Ul2nWBiPjiU6TbUuO/T2ed3P/N2qheSYB0VZsGCq3FSf5BzfcFh2ki28GtSURnUjmMUOVd1Tp16P7qw6VPBhHO6PZ11lkwbavXFlalw9IpbGLwNUgUL7xwZncu0KUVzkq5OL08N8kfespVYbl1rOXgXQ090hFIqVFIFe577tlIX381zpXuD+lhh/KmKgpOUuBiJlOX7AUxRrb5FPyqb9vmfNfxlY4h4YmnxXRvWh9bYE/y74TimQ1BKpVFCedvjmIIn7qc29U8Q6iyc7chBwka5TykY8hyxHQsc2DxsV0eZbQCfmMxU42cU0pDT7VDhwy+DjN1c5HgyTDmkN/8AGDMce3MD6bEAAAAASUVORK5CYII=)',
        },
        circle: {
            green: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxNWFhYjhmNC1kZDA2LTQ1MzYtYjViOC1hOTdkN2Q0YzRhNTgiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RTMzQTM3OEQ4MDcxMTFFNzk3Rjg4MjdDNTgyN0VGMUIiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RTMzQTM3OEM4MDcxMTFFNzk3Rjg4MjdDNTgyN0VGMUIiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpkN2EwZjQxYi05YWQzLTQyNDEtYTcyOS1mNWRmNDJmODRmYzUiIHN0UmVmOmRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpiNWFmYjg5Ni1jODhhLTExN2EtODIzZi1iZTE0NTFhN2U5ZGYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz43yD1PAAABgklEQVR42mJkQAJOm5axcLKwpHGxsKb/+PtHiYWRieHP/38MHMws9779+T3z+58/s/b5Rf2BqWdE0qjFy8q2y0xMSihYSZ1TTUAILPkfiG99eMew9t7N76dePXv3+fcvN6AB15Bt1PLfvubT2dcv/uMDIHmQOpB6sM0gpwJtfFBnYiNtJCION/D8m5cMr75/ZRDj5GYwRBI/BxRvOnPkKdAFCmA/gpyKrBEEFt+6wnDx7SsGfWExFM0gdSD1x14+SWMCBQ7IjwxoAGgolGZFl2IAqQfpYwKFKihw0AEzMKRBgJWJCUMOpB6kjwkUHYwMmAAYDmCahxXTZpB6kD4WUDz+R44zKMjXM2HI1DZkYGdmwdAMUg/SxwRKAKB4RAeLbl5hSDu4g2HhzcsYciD1IH1MoJQDSgDoCt7+/M7wEhhVIBodgNSD9DHLhgeef/PjW7qagDCfJBcPXIEoBxeDtpAIg4W4NIMIBydKPC+7ffXV1z+/YylLYZSkbUZKchVAgAEA2mUKEEGX320AAAAASUVORK5CYII=)',
            red: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA4ZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxNWFhYjhmNC1kZDA2LTQ1MzYtYjViOC1hOTdkN2Q0YzRhNTgiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RUQ2RTc4NEM4MDZGMTFFNzk3Rjg4MjdDNTgyN0VGMUIiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RUQ2RTc4NEI4MDZGMTFFNzk3Rjg4MjdDNTgyN0VGMUIiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpkN2ZhN2Y3MS0wOWQzLTRiN2EtYmMxNS1hZGRkMjMwYzk4MTciIHN0UmVmOmRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpiNWFmYjg5Ni1jODhhLTExN2EtODIzZi1iZTE0NTFhN2U5ZGYiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5e541PAAABgklEQVR42mJkQALPfWxYGDk40xi5uNP///yuxMjMwvD/7x8GRnbOe/+/fZ35/8f3WZJbjvyBqWdE0qjFxMO7i93EUojLL4STVUUDKAuU/v+f4fedGwzfNq35/vPM8Xf/vnx2AxpwDdlGrZcRnp9+XjjzHx8AyYPUgdSDbQY5FWjjA4GKZmk2fWO4gb8unWP4+/olA7OoOAObnhFC/OJZhg8dtU+BLlAA+xHkVGSNIPBl+XyGX1cuMLDpGDAIIWkGqQOp/3HicBoTKHBAfmRAA4ycnFCaC12KAaQepI8JFKrgwEHXDAxpMM3KiiEHUg/SxwRWxMiIqZmHF0Jz8zBgSjKCDWcBxSMoOtAN4MssZuBNyWVgZGPH1AxUD9LHBEoAoHhEB6AAe5uXyPBl2TwMOZB6kD4mUMoBJQB0Bf/ev2X4++oFmEYHIPUgfczFSlLn/715lc6qqsHHLCEFV8AsLMLApqnLwG5qCWSLosTz11WLXgE1x1KWwihJ24yU5CqAAAMA0ykMZcl8/DkAAAAASUVORK5CYII=)',
        }
    },
    colors: {
        all: [
            '#8cd1e8', '#7dbc5d', '#ec6262', '#f9c73c', '#515151', '#f78343', '#758082', '#975ca1', '#0099bc', '#d89ebb',
            '#bce2ed', '#a7cf8b', '#ea8f8f', '#f2ca68', '#7c7c7c', '#efac7b', '#9d9f9f', '#c295c4', '#6cb1bc', '#e7c8d9',
            '#27aace', '#529e33', '#a81b1b', '#dc9902', '#333333', '#d75d13', '#4e4f4f', '#6a2479', '#005866', '#94426b'
        ],
        blue: '#7fc3f1',
        red: '#e74c3c',
        green: '#42b2a6',
        annotation: {
            inactive: '#6BB9F0',
            active: '#3498DB',
        },
    },
    symbols: ['\u25CF', '\u25C6', '\u25A0', '\u25B4', '\u25BE'],
    trendLine: {
        lineWidth: 1,
        extrapolate: '20%',
        showLegends: true,
        showTooltips: true,
        useSameColors: true,
        legendPrefix: 'Trend Line - '
    },
    twoAxis: {
        titles: {
            // if we have more than threshold number of series in
            // chart, titles will not be displayed at all
            threshold: 10
        }
    },
    typeMap: {
        default: {
            scatter: 'scatter',
            bubble: 'bubble',
            sankey: 'sankey',
            line: 'line',
            spline: 'spline',
            bar: 'column',
            sunburst: 'sunburst',
            treemap: 'treemap',
            bullet: 'bullet',
            horizontal: 'bar',
            symbol: 'line',
            gauge: 'gauge',
            pie: 'pie',
            donut: 'pie',
            mixed: 'line',
            funnel: 'funnel',
            arearange: 'line'
        },
        filled: {
            scatter: 'scatter',
            bubble: 'bubble',
            sankey: 'sankey',
            line: 'area',
            spline: 'areaspline',
            bar: 'column',
            sunburst: 'sunburst',
            treemap: 'treemap',
            bullet: 'bullet',
            horizontal: 'bar',
            symbol: 'area',
            gauge: 'gauge',
            pie: 'pie',
            donut: 'pie',
            mixed: 'area',
            funnel: 'funnel',
            arearange: 'line'
        }
    },
    date: {
        format: (date, frequency = '', options = {}) => {

            // If this is required for tooltop we always display full date
            if(options.isTooltip) frequency = 'Tooltip';

            let format = "dddd, MMMM Do YYYY, HH:mm";

            let clonedFreq = _.clone(frequency);

            switch(clonedFreq.toLowerCase()) {
                case 'hourly':
                    format = "HH:mm";
                    if(options.isPieDonut) format = "dddd, MMMM Do YYYY, HH:mm";
                    if(options.isTable) format = "MMMM Do YYYY, HH:mm";
                    break;
                case 'daily':
                    format = "MMM Do";
                    if(options.isPieDonut) format = "dddd, MMMM Do YYYY";
                    if(options.isTable) format = "MMM Do YYYY";
                    break;
                case 'weekly':
                    format = "MMM Do";
                    if(options.withYear) format = "MMM Do YYYY";
                    break;
                case 'monthly':
                    format = "MMMM 'YY";
                    break;
                case 'quarterly':
                    format = "[Q]Q YYYY";
                    break;
                case 'yearly':
                    format = "YYYY";
                    break;
            }

            //if not a valid date, return original value instead of 'invalid date'
            if(String(date).length > 1) {
                if(moment(new Date(date)).isValid()) return moment(date).format(format);
                if(moment(new Date(+date)).isValid()) return moment(+date).format(format);
            }

            return date;
        }
    }
};

