'use strict';

import HighchartConfig from './card/highchart/highchart.config';

export default {
    fonts: [
        { label: 'Open Sans', family: 'Open Sans', google: true },
        { label: 'Roboto', family: 'Roboto', google: true },
        { label: 'Lato', family: 'Lato', google: true },
        { label: 'Ubuntu', family: 'Ubuntu', google: true },
        { label: 'Montserrat', family: 'Montserrat', google: true },
        { label: 'Nunito', family: 'Nunito', google: true },
        { label: 'Exo 2', family: 'Exo 2', google: true },
        { label: 'Oswald', family: 'Oswald', google: true },
        { label: 'Dosis', family: 'Dosis', google: true },
        { label: 'EB Garamond', family: 'EB Garamond', google: true },
        { label: 'Raleway', family: 'Raleway', google: true },
        { label: 'Rubik', family: 'Rubik', google: true },
    
        { label: 'Arial', family: 'Arial, "Helvetica Neue", Helvetica, sans-serif' },
        { label: 'Helvetica', family: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
        { label: 'TimesNewRoman', family: 'TimesNewRoman, "Times New Roman", Times, Baskerville, Georgia, serif' },
        { label: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
        { label: 'Trebuchet', family: '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", Tahoma, sans-serif' },
        { label: 'Calibri', family: 'Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif' },
        { label: 'Tahoma', family: 'Tahoma, Verdana, Segoe, sans-serif' },
        { label: 'Courier', family: '"Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace' },
        { label: 'Century Gothic', family: '"Century Gothic", CenturyGothic, AppleGothic, sans-serif' },
        { label: 'Optima', family: 'Optima, Segoe, "Segoe UI", Candara, Calibri, Arial, sans-serif' },
    ],
    font: 'Roboto',
    colors: {
        font: '#34495e',
        background: '#f0f3f4',
        chart: _.clone(HighchartConfig.colors.all),
        link: {
            active: '#ef3943',
            text: '#34495e',
        },
        footer: {
            background: '#fff',
        },
        sidebar: {
            background: '#BDC3C7',
            text: '#fff',
        },
        header: {
            background: '#22313F',
            text: '#DADFE1',
        },
        table: {
            header: {
                background: '#fff',
                text: '#34495e',
            },
        },
    },
};
