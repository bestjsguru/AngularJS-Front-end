'use strict';

export default class ColorPickerConfig {
    constructor() {
        let dashboardColors = window.dashboard && window.dashboard.theme.useCustomTheme && window.dashboard.theme.colors.chart;
        
        this.config = {
            showInput: true,
            palette: dashboardColors || window.Auth.user.organisation.theme.colors.chart,
            showPalette: true,
            hideAfterPaletteSelect: true,
            preferredFormat: 'hex',
            showInitial: true,
            allowEmpty: true,
        };
    }
    
    get() {
        return this.config;
    }
}
