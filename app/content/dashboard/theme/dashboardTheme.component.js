'use strict';

import './dashboardTheme.service';
import ThemeConfig from '../../theme.config';
import ColorPickerConfig from '../../common/colorPicker/colorPickerConfig';

class DashboardThemeCtrl {
    
    constructor($q, Auth, OrganisationService, $element, DashboardThemeService, toaster, DeregisterService, $scope, $rootScope, DashboardCollection) {
        this.$q = $q;
        this.Auth = Auth;
        this.toaster = toaster;
        this.$element = $element;
        this.$rootScope = $rootScope;
        this.OrganisationService = OrganisationService;
        this.DashboardThemeService = DashboardThemeService;
        this.DashboardCollection = DashboardCollection;
        
        this.watchers = DeregisterService.create($scope);
    
        this.ColorPickerConfig = new ColorPickerConfig();
        
        this.user = this.Auth.user;
        
        this.fonts = ThemeConfig.fonts;
        this.fonts.sort((a, b) => a.label.localeCompare(b.label));
    }
    
    $onInit() {
        this.currentDashboard = this.DashboardCollection.getById(this.dashboard.id);

        this.theme = this.DashboardThemeService.create(this.currentDashboard.theme.getJson());
        this.organisationTheme = this.DashboardThemeService.create(this.user.organisation.theme.getJson());

        if(this.currentDashboard.theme.isDefault()) {
            this.theme = this.DashboardThemeService.create(this.currentDashboard.theme.useOrganisationTheme().getJson());
        }

        this.fonts.selected = this.fonts.find(font => font.label === this.theme.font);
    }
    
    save() {
        console.log(this.isFormPictureChanged());
        
        let picturePromise = this.isFormPictureChanged() ? this.savePicture() : this.$q.when(true);
        
        this.loading = true;
        
        picturePromise.then(() => this.saveThemeSettings()).finally(() => {
            this.loading = false;
        });
    }
    
    isFormPictureChanged() {
        return !!this.currentDashboard.logoFile;
    }
    
    savePicture() {
        return this.DashboardThemeService.updatePicture(this.currentDashboard).then(() => {
            // Update dashboard values in current session
            this.DashboardCollection.trigger('updated', this.currentDashboard.id);
    
            this.clearImageForm();
            
            this.toaster.success('Dashboard logo saved');
        }).catch(() => {
            this.toaster.error('Failed to update logo. Please try again');
        });
    }
    
    clearImageForm() {
        delete this.currentDashboard.logoFile;
    
        this.$element.find('#prevImage').first().attr('src', this.$element.find('#prevImage').first().attr('ng-src'));
        this.$element.find('.dashboard-logo-wrapper input[type="file"]').first().val('');
        this.$element.find('.dashboard-logo-wrapper input[type="file"]').first().change();
    }
    
    useDefaultLogo() {
        this.clearImageForm();
        
        return this.DashboardThemeService.removePicture(this.currentDashboard).then(() => {
            // Update dashboard values in current session
            this.DashboardCollection.trigger('updated', this.currentDashboard.id);

            this.toaster.success('Dashboard logo removed');
        }).catch(() => {
            this.toaster.error('Failed to remove logo. Please try again');
        });
    }
    
    saveThemeSettings() {
        return this.DashboardThemeService.saveTheme(this.currentDashboard.id, this.theme).then((response) => {
            this.currentDashboard.update(response);
    
            this.toaster.success('Theme settings saved');
            this.$rootScope.$broadcast('dashboard.theme.updated', this.theme.getJson());
            this.close();
        });
    }
    
    reset() {
        this.theme.font = this.DashboardThemeService.create().font;
        this.theme.colors = this.DashboardThemeService.create().colors;
    
        this.fonts.selected = this.fonts.find(font => font.label === this.theme.font);
        this.onFontChange();
    }
    
    onFontChange() {
        if(this.fonts.selected.google) {
            WebFont && WebFont.load({
                google: {
                    families: [this.fonts.selected.label]
                },
                active: () => {
                    this.previewFont(this.fonts.selected);
                }
            });
        } else {
            this.previewFont(this.fonts.selected);
        }
    
        this.theme.font = this.fonts.selected.label;
    }
    
    previewFont(font) {
        this.$element.find('.font-preview h4').css('font-family', font.family);
    }
    
    addNewChartColor() {
        this.theme.colors.chart.push(null);
    }
    
    resetColor(color) {
        _.set(this.theme.colors, color, _.get(this.DashboardThemeService.create().colors, color));
    }
    
    removeChartColor(index) {
        this.theme.colors.chart.splice(index, 1);
    }
    
    toggleOrganisationChartColors() {
        this.theme.colors.useOrganisationChartColors = !this.theme.colors.useOrganisationChartColors;
        
        this.theme.colors.chart = _.cloneDeep(this.organisationTheme.colors.chart);
    }
}

truedashApp.component('appDashboardTheme', {
    controller: DashboardThemeCtrl,
    templateUrl: 'content/dashboard/theme/dashboardTheme.html',
    bindings: {
       close: '&',
       dashboard: '=',
    },
});
