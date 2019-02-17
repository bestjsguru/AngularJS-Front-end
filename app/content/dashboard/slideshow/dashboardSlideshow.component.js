'use strict';

class DashboardSlideshowCtrl {
    constructor($rootScope, DashboardCollection, AppEventsService, DeregisterService, CacheService, toaster, $stateParams, $scope,
                $state, $document, $element, $q) {
        this.$q = $q;
        this.$state = $state;
        this.toaster = toaster;
        this.$element = $element;
        this.$document = $document;
        this.$rootScope = $rootScope;
        this.CacheService = CacheService;
        this.AppEventsService = AppEventsService;
        this.DashboardCollection = DashboardCollection;
        this.watchers = DeregisterService.create($scope);
        
        this.cards = [];
        this.activeSlide = 0;
        this.dashboardId = $stateParams.dashboardId;

        this.initDashboard();
    }
    
    $onInit() {
        this.$document.on('keyup', (event) => {
            // trigger next slide on right arrow click
            if (event.which === 39) this.nextSlide();
        
            // trigger previous slide on left arrow click
            if (event.which === 37) this.previousSlide();
        });
        
        // Whenever slide changes we want to trigger resize event so charts can fill the space properly
        this.watchers.watch('$ctrl.activeSlide', () => this.$rootScope.$emit('resize'));
    }

    initDashboard() {
        this.DashboardCollection.load().then(() => {
            this.dashboard = this.DashboardCollection.getById(this.dashboardId);
    
            if(!this.dashboard) {
                return this.$q.reject('Dashboard not found');
            }
            
            this.AppEventsService.track('used-presentation-mode', {id: this.dashboard.id});
        }).catch((message) => {
            // Card is not found in any dashboard so we redirect user to default dashboard with a message
            this.toaster.info(message);
            this.$state.go('home');
        }).then(() => {
            return this.trackCardsLoading(true);
        });
    }
    
    isError(card) {
        return card && card.metrics.error;
    }
    
    reload(card) {
        card.restoreOriginalCardData();
        card.cardUpdateModel = undefined;
        card.metrics.load(false);
    }
    
    nextSlide() {
        this.watchers.timeout(() => {
            this.$element.find('.carousel-control.right').first().click();
        });
    }
    
    previousSlide() {
        this.watchers.timeout(() => {
            this.$element.find('.carousel-control.left').first().click();
        });
    }
    
    trackCardsLoading(withInfo = false) {
        if(!this.dashboard) return this.$q.when(true);
        
        this.cardsLoading = true;
        return this.dashboard.trackCardsLoading(withInfo).finally(() => this.cardsLoading = false);
    }
    
    getCardTitle(card) {
        return this.CacheService.get(`slideshow.title.${this.dashboardId}.${card.id}`, null);
    }
    
    saveCardTitle(card, event) {
        let title = angular.element(event.target).parents('.card-title-edit').first().find('textarea')[0].value.trim();
    
        this.AppEventsService.track('used-presentation-mode-title', {
            dashboard: this.dashboard.id,
            card: card.id,
            title: title
        });
        
        this.CacheService.put(`slideshow.title.${this.dashboardId}.${card.id}`, title);
        
        card.inEditMode = false;
    }
    
    cancel(card) {
        card.inEditMode = false;
        card.slideshowTitle = '';
    }
}

truedashApp.component('appDashboardSlideshow', {
    controller: DashboardSlideshowCtrl,
    templateUrl: 'content/dashboard/slideshow/dashboardSlideshow.html'
});
