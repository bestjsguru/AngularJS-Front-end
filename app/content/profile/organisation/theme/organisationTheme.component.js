'use strict';

import './organisationTheme.service';
import ThemeConfig from '../../../theme.config';
import ColorPickerConfig from '../../../common/colorPicker/colorPickerConfig';

class OrganisationThemeCtrl {
    
    constructor(Auth, OrganisationService, $element, OrganisationThemeService, toaster, DeregisterService, $scope, $rootScope) {
        this.Auth = Auth;
        this.toaster = toaster;
        this.$element = $element;
        this.$rootScope = $rootScope;
        this.OrganisationService = OrganisationService;
        this.OrganisationThemeService = OrganisationThemeService;
        
        this.watchers = DeregisterService.create($scope);
    
        this.ColorPickerConfig = new ColorPickerConfig();
        
        this.user = this.Auth.user;
        
        this.fonts = ThemeConfig.fonts;
        this.fonts.sort((a, b) => a.label.localeCompare(b.label));
        
        this.theme = this.user.organisation.theme;
    
        this.fonts.selected = this.fonts.find(font => font.label === this.theme.font);
    }
    
    $onInit() {
        this.loadOrganisation();
    }
    
    save() {
        this.loading = true;
        this.OrganisationThemeService.saveTheme(this.theme).then(() => {
            this.toaster.success('Theme settings saved');
        }).finally(() => {
            this.loading = false;
        });
    }
    
    reset() {
        this.theme = this.OrganisationThemeService.create();

        this.theme.colors.chart = this.OrganisationThemeService.create().colors.chart;
        this.fonts.selected = this.fonts.find(font => font.label === this.theme.font);

        this.updateTheme();
    }
    
    loadOrganisation() {
        this.OrganisationService.load().then((organisation) => {
            this.organisation = organisation;
        });
    }
    
    onFontChange() {
        this.theme.font = this.fonts.selected.label;
        this.updateTheme();
    }
    
    addNewChartColor() {
        this.theme.colors.chart.push(null);
    }
    
    resetColor(color) {
        _.set(this.theme.colors, color, _.get(this.OrganisationThemeService.create().colors, color));
    
        this.updateTheme();
    }
    
    removeChartColor(index) {
        this.theme.colors.chart.splice(index, 1);
    
        this.updateTheme();
    }
    
    updateTheme() {
        this.$rootScope.$broadcast('organisation.theme.updated', this.theme.getJson());
    }
    
    toggleDefaultChartColors() {
        this.theme.colors.useDefaultChartColors = !this.theme.colors.useDefaultChartColors;
    
        this.theme.colors.chart = this.OrganisationThemeService.create().colors.chart;
    }
}

truedashApp.component('appOrganisationTheme', {
    controller: OrganisationThemeCtrl,
    templateUrl: 'content/profile/organisation/theme/organisationTheme.html',
});
