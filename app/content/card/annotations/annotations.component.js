'use strict';

import './annotations.service';
import HighchartConfig from '../highchart/highchart.config';
import {Helpers} from '../../common/helpers';

class AnnotationsCtrl {
    constructor($q, DeregisterService, $rootScope, $scope, AnnotationsService, Auth, $element, AppEventsService) {
        this.$q = $q;
        this.Auth = Auth;
        this.$scope = $scope;
        this.$element = $element;
        this.$rootScope = $rootScope;
        this.AppEventsService = AppEventsService;
        this.AnnotationsService = AnnotationsService;

        this.watchers = DeregisterService.create($scope);
        
        this.highlighted = {};
        this.user = this.Auth.user;
    }

    $onInit() {
        this.card.metrics.on('loaded', this.init, this);
    
        if(this.user.hasAnyPermission('annotations annotations-management')) {
            this.loading = true;
            
            this.AnnotationsService.getForCard(this.card.id, false).then(annotations => {
                this.card.annotations.init(annotations);
            }).finally(() => {
                this.loading = false;
            });
    
            if(this.user.hasPermission('annotations-management')) {
                this.watchers.onRoot('highchart.point.click', (e, point) => {
                    this.explore.setTab('annotations');
        
                    if(point.annotation) {
                        // Unselect all annotations
                        this.card.annotations.toggle();
            
                        let annotations = this.card.annotations.items.filter(item => item.isSibling(point));
            
                        if(annotations.length) {
                            this.watchers.timeout(() => {
                                annotations.forEach(annotation => {
                                    annotation.selected = point.selected;
                                });
                            });
                        }
            
                        return;
                    }
        
                    this.watchers.timeout(() => {
                        let sibling = this.card.annotations.items.find(item => item.isSibling(point));
            
                        let annotation = this.card.annotations.add({
                            x: point.x,
                            date: (new Date()).getTime(),
                            category: point.category,
                            cardId: this.card.id,
                            owner: this.Auth.user,
                            title: point.series.name,
                            selected: sibling && sibling.selected
                        });
            
                        this.card.annotations.sortAnnotations();
            
                        this.watchers.timeout(() => {
                            let index = this.card.annotations.items.indexOf(annotation) + 1;
                
                            let element = this.$element.find('.annotations-table tr:nth-child(' + index + ')');
                            if(element.length) {
                                element.find('input[type=text]').focus();
                                this.$element.find('.annotations')[0].scrollTop = element[0].offsetTop - 100;
                            }
                
                        }, 100);
                    });
                });
            }
    
            this.watchers.onRoot('highchart.point.mouseover', (e, point) => {
                this.$scope.$apply(() => {
                    this.highlighted = {
                        x: point.x,
                        category: point.category,
                    };
            
                    let index = this.card.annotations.items.findIndex(item => item.isSibling(this.highlighted)) + 1;
            
                    let element = this.$element.find('.annotations-table tr:nth-child(' + index + ')');
                    if(element.length) {
                        this.$element.find('.annotations')[0].scrollTop = element[0].offsetTop - 100;
                    }
            
                });
            });
    
            this.watchers.onRoot('highchart.mouseout', () => {
                this.$scope.$apply(() => {
                    this.highlighted = {};
                });
            });
        }
    }
    
    isHighlighted(item) {
        return item.isSibling(this.highlighted);
    }
    
    toggle(item) {
        this.watchers.timeout(() => {
            this.card.annotations.toggle(item);
            return this.$rootScope.$broadcast('annotations.toggle', item);
        });
    }
    
    showChartTooltip(item) {
        this.highlighted = {
            x: item.x,
            category: item.category,
        };
        let index = this.card.metrics.get(0).getData().findIndex(item => item[0] === this.highlighted.x);
    
        console.log(index);
        
        return this.$rootScope.$broadcast('highchart.showTooltip', {index});
    }
    
    hideChartTooltip() {
        this.highlighted = {};
        this.$rootScope.$broadcast('highchart.hideTooltip');
    }
    
    save(item) {
        item.loading = true;
        
        let promise = item.isInEditMode ? this.AnnotationsService.update(item) : this.AnnotationsService.create(item);
        
        promise.then(annotation => {
            if(!item.isInEditMode) {
                this.AppEventsService.track('annotation-created', {id: annotation.id});
            } else {
                this.AppEventsService.track('annotation-updated', {id: annotation.id});
            }
    
            item.isInEditMode = false;
            item.id = annotation.id;
        }).finally(() => {
            item.loading = false;
        });
    }
    
    update(item) {
        item.isInEditMode = true;
        item.saveState();
    }
    
    remove(item) {
        this.hideChartTooltip();
        
        if(item.isInEditMode) {
            item.isInEditMode = false;
            return item.rollback();
        }
        
        // This annotation is not yet saved so we just remove it from collection.
        if(item.isNew()) return this.card.annotations.remove(item);
    
        item.loading = true;
        this.AnnotationsService.remove(item.id).then(() => {
            this.AppEventsService.track('annotation-removed', {id: item.id});
            this.card.annotations.remove(item);
        });
    }
    
    formattedCategory(category) {
        return HighchartConfig.date.format(category, this.card.frequencies.selected);
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
    }
}

truedashApp.component('appAnnotations', {
    controller: AnnotationsCtrl,
    templateUrl: 'content/card/annotations/annotations.html',
    bindings: {
        card: '='
    },
    require: {
        explore: '^tuExplore'
    }
});
