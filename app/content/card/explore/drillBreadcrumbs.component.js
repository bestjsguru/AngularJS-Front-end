'use strict';

class DrillBreadcrumbsCtrl{
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
    }

    $onInit() {
        this.updateDrillLevels();
        this.card.drill.on('reset drillDown drillUp', this.updateDrillLevels, this);
    }

    updateDrillLevels() {
        this.levels = [];
        this.activeLevel = this.card.drill.getActiveLevel();
        if (!this.card.drill.isActive()) return;
        this.levels = [];
        this.card.drill.drillPoints.forEach((filter, idx) => {
            var name;
            var level = this.card.drill.activeMap.levels[idx];
            if (level.operation == 'grain') {
                name = 'Grain';
            } else if (filter == null && level.operation == 'groupby') {
                name = 'By ' + level.column.name;
            } else {
                name = `${level.column.name} == ${filter}`;
            }
            this.levels.push({name});
        });
    }

    reset() {
        this.card.drill.reset();
    }

    up() {
        this.card.drill.drillUp();
    }

    $onDestroy() {
        this.card.drill.off('reset drillDown drillUp', null, this);
    }
}

truedashApp.component('tuDrillBreadcrumbs', {
    controller: DrillBreadcrumbsCtrl,
    templateUrl: 'content/card/explore/drillBreadcrumbs.html',
    bindings: {
        card: '='
    }
});
