'use strict';

import ThemeConfig from '../../../theme.config';

export default class OrganisationTheme {
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
    }
    
    extendWithDefaults(data) {
        return _.defaultsDeep(data, {
            id: null,
            name: null,
            font: _.clone(ThemeConfig.font),
            colors: {
                font: _.clone(ThemeConfig.colors.font),
                background: _.clone(ThemeConfig.colors.background),
                useDefaultChartColors: true,
                chart: _.clone(ThemeConfig.colors.chart),
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
        };
        
        if(this.id) data.id = this.id;
        if(this.name) data.name = this.name;
        
        return JSON.parse(JSON.stringify(data));
    }
}
