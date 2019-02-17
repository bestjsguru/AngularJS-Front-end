'use strict';

import ThemeConfig from '../../theme.config';

export default class DashboardTheme {
    constructor(data) {
        data = JSON.parse(JSON.stringify(data || {}));
        data = this.extendWithDefaults(data);
        
        this.init(data);
    }
    
    init(data) {
        this.id = data.id;
        this.name = data.name;
        this.font = data.font;
        this.colors = data.colors;
        this.useCustomTheme = data.useCustomTheme;
    }
    
    extendWithDefaults(data) {
        let chartColors = _.get(data, 'colors.useOrganisationChartColors', true) ? window.Auth.user.organisation.theme.colors.chart : ThemeConfig.colors.chart;
    
        return _.defaultsDeep(data, {
            id: null,
            name: null,
            useCustomTheme: false,
            font: _.clone(ThemeConfig.font),
            colors: {
                font: _.clone(ThemeConfig.colors.font),
                background: _.clone(ThemeConfig.colors.background),
                chart: _.clone(chartColors),
                useOrganisationChartColors: true,
                link: {
                    text: _.clone(ThemeConfig.colors.link.text),
                    active: _.clone(ThemeConfig.colors.link.active),
                },
                footer: {
                    background: _.clone(ThemeConfig.colors.footer.background),
                },
                sidebar: {
                    background: _.clone(ThemeConfig.colors.sidebar.background),
                    text: _.clone(ThemeConfig.colors.sidebar.text),
                },
                header: {
                    background: _.clone(ThemeConfig.colors.header.background),
                    text: _.clone(ThemeConfig.colors.header.text),
                },
                table: {
                    header: {
                        background: _.clone(ThemeConfig.colors.table.header.background),
                        text: _.clone(ThemeConfig.colors.table.header.text),
                    },
                },
            },
        });
    }
    
    isDefault() {
        let theme = this.getFontAndColors(this);
        let defaults = this.getFontAndColors(this.extendWithDefaults({}));
        
        return _.isEqual(theme, defaults);
    }
    
    useOrganisationTheme() {
        this.font = JSON.parse(JSON.stringify(window.Auth.user.organisation.theme.font));
        this.colors = JSON.parse(JSON.stringify(window.Auth.user.organisation.theme.colors));
        
        return this;
    }
    
    getFontAndColors(theme) {
        return {
            font: theme.font,
            colors: theme.colors,
        };
    }
    
    get fontFamily() {
        let font = ThemeConfig.fonts.find(font => font.label === this.font);
        
        if(font) {
            if(font.google) return font.family + ', Roboto';
            
            return font.family;
        }
        
        return this.font;
    }
    
    getJson() {
        let data = {
            font: this.font,
            colors: this.colors,
            useCustomTheme: this.useCustomTheme,
        };
        
        if(this.id) data.id = this.id;
        if(this.name) data.name = this.name;
    
        return JSON.parse(JSON.stringify(data));
    }
}
