'use strict';

import '../../profile/organisation/theme/organisationTheme.service';
import '../../dashboard/theme/dashboardTheme.service';
import ThemeConfig from '../../theme.config';

class CustomThemeStyleCtrl {
    
    constructor($q, $rootScope, $compile, $scope, $element, $state, DeregisterService, OrganisationThemeService, DashboardThemeService, DashboardCollection) {
        this.$q = $q;
        this.$scope = $scope;
        this.$state = $state;
        this.$compile = $compile;
        this.$element = $element;
        this.$rootScope = $rootScope;
        this.DashboardCollection = DashboardCollection;
        this.DashboardThemeService = DashboardThemeService;
        this.OrganisationThemeService = OrganisationThemeService;
        this.watchers = DeregisterService.create(this.$scope);
    
        this.changeToOrganisationTheme(window.Auth.user.organisation.theme);
    }
    
    $onInit() {
        
        this.watchers.onRoot('organisation.theme.updated', (event, theme) => {
            this.changeToOrganisationTheme(this.OrganisationThemeService.create(theme));
            
            this.loadFont();
        });
        
        this.watchers.onRoot('dashboard.theme.updated', (event, theme) => {
            this.changeToOrganisationTheme(window.Auth.user.organisation.theme);
    
            let promise = this.$q.when(true);
            
            if(theme.useCustomTheme) {
                promise = this.changeToDashboardTheme(null, this.DashboardThemeService.create(theme));
            }
    
            promise.then(() => {
                this.loadFont();
                this.$rootScope.$broadcast('highchart.colors.change');
            });
        });
    
        this.watchers.onRoot('$stateChangeSuccess', (event, next, params) => {
            this.changeToOrganisationTheme(window.Auth.user.organisation.theme);
    
            let promise = this.$q.when(true);
            
            if(['dashboard'].includes(next.name)) {
                promise = this.changeToDashboardTheme(params.dashboardId);
            }
    
            promise.then(() => this.loadFont());
        });
    }
    
    $postLink() {
        this.loadFont();
        let style = this.$element.find('style').html();
        
        if (style) {
            let template = this.$compile(`<style ng-bind-template="${style}"></style>`);
            this.$element.replaceWith(template(this.$scope));
        }
    }
    
    getDashboardTheme(id) {
        let dashboard = this.DashboardCollection.getById(id);
        
        return dashboard.theme.useCustomTheme ? dashboard.theme : false;
    }
    
    loadFont() {
        let font = ThemeConfig.fonts.find(font => font.label === this.theme.font);
        
        if(font.google) {
            WebFont && WebFont.load({
                google: {
                    families: [font.label],
                },
            });
        }
    }
    
    changeToOrganisationTheme(theme) {
        delete window.dashboard;
        this.theme = theme;
        window.Auth.user.organisation.theme = theme;
    }
    
    changeToDashboardTheme(id, theme) {
        delete window.dashboard;
        
        let promise = this.$q.when(true);
        
        if(!theme) {
            promise = this.DashboardCollection.load().then(() => {
                theme = this.getDashboardTheme(parseInt(id));
            });
        }
    
        return promise.then(() => {
            if(theme) {
                this.theme = theme;
                window.dashboard = {theme: theme};
            }
        });
    }
}

truedashApp.component('appCustomThemeStyle', {
    templateUrl: 'content/layout/customTheme/customThemeStyle.html',
    controller: CustomThemeStyleCtrl
});
