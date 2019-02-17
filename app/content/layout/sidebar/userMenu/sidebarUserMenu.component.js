'use strict';

class SidebarUserMenuCtrl {
    
    constructor(Auth, FreshchatService, DeregisterService, $scope, $document, $element, $state) {
        this.Auth = Auth;
        this.$state = $state;
        this.$element = $element;
        this.$document = $document;
        this.FreshchatService = FreshchatService;
        this.watchers = DeregisterService.create($scope);
        this.user = this.Auth.isLoggedIn() ? this.Auth.user : false;
    
        this.unreadCount = this.FreshchatService.unreadCount;

        this.FreshchatService.on('unreadCountChange', (count) => {
            this.watchers.timeout(() => {
                this.unreadCount = count;
            });
        });

        this.isVisible = false;
        
        this.closeOnClick();
    }
    
    get isEmbed() {
        return window.Location.isEmbed;
    }
    
    isLinkActive(link) {
        return link && this.$state.is(link);
    }
    
    isChatInitiated() {
        return this.FreshchatService.isInitiated();
    }
    
    onChatClick() {
        return this.FreshchatService.open();
    }
    
    closeOnClick() {
        // Hide menu when clicked on any dropdown on page because
        // dropdowns will prevent regular click event from happening
        this.$document.on('show.bs.dropdown', () => {
            this.isVisible && this.hide();
        });
        
        // Hide menu when clicked outside of it anywhere on page
        this.$document.bind('click', (event) => {
            if(!this.isVisible) return;
        
            let element = angular.element(event.target);
            let clickedOutside = this.$element.find(event.target).length === 0;
            let clickedRegularLink = element.hasClass('dashboard-link') || element.parents('.dashboard-link').length > 0;

            let shouldBeClosed = clickedOutside || clickedRegularLink;

            shouldBeClosed && this.hide();
        });
    }
    
    toggle() {
        this.isVisible ? this.hide() : this.show();
    }
    
    hide() {
        this.watchers.timeout(() => this.isVisible = false);
    }
    
    show() {
        this.watchers.timeout(() => this.isVisible = true);
    }
}

truedashApp.component('appSidebarUserMenu', {
    controller: SidebarUserMenuCtrl,
    templateUrl: 'content/layout/sidebar/userMenu/sidebarUserMenu.html'
});
