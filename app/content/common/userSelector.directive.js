'use strict';

class UserSelectorCtrl {
    constructor($filter) {
        this.$filter = $filter;
    }

    $onInit() {
        this.users.then(this.onUsersLoaded.bind(this));
    }

    onUsersLoaded(users) {
        users = users.filter(u => u.email);
        users.forEach(this.userDecorator.bind(this));
        this.decoratedUsers = users;
        this.searchTerm = '';

        if (this.ngModel && this.ngModel.length) {
            this.ngModel.forEach((user) => {
                var res = this.decoratedUsers.filter(userItem => userItem.email == user.email);

                if (res.length) {
                    res[0].setActive(true);
                    res[0].subscriptionId = user.subscriptionId;
                }
            });
        }
    }

    toggleCurrentlyFilteredUser(e) {
        if (e.keyCode != 13) return;
        var users = this.$filter('searchByProperties')(this.decoratedUsers, 'fullName, username', this.searchTerm);
        if (users.length == 1) users[0].toggleActive();
    }

    refreshModel() {
        this.ngModel = this.decoratedUsers.filter(user => user.getActive());
    }

    userDecorator(user) {
        var active = false;
        user.getActive = () => active;
        user.setActive = (bool) => { active = bool; };
        user.toggleActive = () => { active = !active;};
    }
}

truedashApp.directive('tuUserSelector', () => {
    return {
        controller: UserSelectorCtrl,
        restrict: 'E',
        templateUrl: 'content/common/userSelector.html',
        replace: true,
        bindToController: true,
        controllerAs: 'userSelector',
        scope: {
            users: '=',
            ngModel: '='
        }
    };
});
