'use strict';

class GoalController {
    $onInit() {
        this.card = this.resolve.card;
        this.goal = _.clone(this.card.goal);
    }
    
    save() {
        this.goal = parseFloat(this.goal);
        
        if(isNaN(this.goal)) this.goal = null;
        
        this.card.goal = this.goal;
        this.card.metrics.reloadData();
        this.dismiss();
    }
}

truedashApp.component('appGoal', {
    controller: GoalController,
    templateUrl: 'content/builder/goal/goal.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
