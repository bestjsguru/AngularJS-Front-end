'use strict';
angular.module('ui-templates', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('uib/template/pagination/pagination.html',
        '<ul class="pagination">\n' +
        '  <li ng-if="boundaryLinks" ng-class="{disabled: noPrevious()}"><a href ng-click="selectPage(1)" title="First"><i class="fa fa-angle-double-left"></i></i></a></li>\n' +
        '  <li ng-if="directionLinks" ng-class="{disabled: page === 1}"><a href ng-click="selectPage(page - 1)" title="Previous"><i class="fa fa-2x fa-angle-left"></i></a></li>\n' +
        '  <li ng-repeat="page in pages track by $index" ng-class="{active: page.active}"><a href ng-click="selectPage(page.number)">{{page.text}}</a></li>\n' +
        '  <li ng-if="directionLinks"><a href ng-click="selectPage(page + 1)" title="Next"><i class="fa fa-2x fa-angle-right"></i></a></li>\n' +
        '  <li ng-if="boundaryLinks"><a href ng-click="selectPage(totalPages)" title="Last"><i class="fa fa-angle-double-right"></i></a></li>\n' +
        '</ul>');
    
    $templateCache.put('select2/choices.tpl.html',
        `<ul class="ui-select-choices ui-select-choices-content select2-results">
           <li class="ui-select-choices-group" ng-class="{'select2-result-with-children': $select.isGrouped, 'collapsed': $group.collapsed}">
             <i class="fa expand-group-icon" ng-class="{'fa-plus':$group.collapsed, 'fa-minus':!$group.collapsed}"
             ng-click="$group.collapsed = !$group.collapsed"></i>
             <div ng-show="$select.isGrouped" class="ui-select-choices-group-label select2-result-label" ng-bind-html="$group.name"
             ng-click="$group.collapsed = !$group.collapsed"></div>
             <ul ng-class="{'select2-result-sub': $select.isGrouped, 'select2-result-single': !$select.isGrouped}">
               <li class="ui-select-choices-row" ng-class="{'select2-highlighted': $select.isActive(this), 'select2-disabled': $select.isDisabled(this)}">
                 <div class="select2-result-label ui-select-choices-row-inner"></div>
               </li>
             </ul>
           </li>
         </ul>`);
    
    $templateCache.put('uib/template/carousel/carousel.html',
        `<div class="carousel-inner" ng-transclude></div>
        <a role="button" class="left carousel-control" ng-click="prev()" ng-class="{ disabled: isPrevDisabled() }" ng-show="slides.length > 1">
            <span aria-hidden="true" class="fa fa-2x fa-angle-left"></span>
            <span class="sr-only">previous</span>
        </a>
        <a role="button" class="right carousel-control" ng-click="next()" ng-class="{ disabled: isNextDisabled() }" ng-show="slides.length > 1">
            <span aria-hidden="true" class="fa fa-2x fa-angle-right"></span>
            <span class="sr-only">next</span>
        </a>
        <ol class="carousel-indicators" ng-show="slides.length > 1">
            <li ng-repeat="slide in slides | orderBy:indexOfSlide track by $index" ng-class="{ active: isActive(slide) }" ng-click="select(slide)">
                <span class="sr-only">slide {{ $index + 1 }} of {{ slides.length }}<span ng-if="isActive(slide)">, currently active</span></span>
            </li>
        </ol>`);
    
    $templateCache.put('uib/template/carousel/slide.html', `<div ng-transclude></div>`);
    
    $templateCache.put('uib/template/datepicker/day.html',
        `<table role="grid" aria-labelledby="{{::uniqueId}}-title" aria-activedescendant="{{activeDateId}}">
          <thead>
            <tr>
              <th><button type="button" class="btn btn-default btn-sm pull-left uib-left" ng-click="move(-1)" tabindex="-1"><i aria-hidden="true" class="glyphicon glyphicon-chevron-left"></i><span class="sr-only">previous</span></button></th>
              <th colspan="{{::5 + showWeeks}}"><button id="{{::uniqueId}}-title" role="heading" aria-live="assertive" aria-atomic="true" type="button" class="btn btn-default btn-sm uib-title" ng-click="toggleMode()" ng-disabled="datepickerMode === maxMode" tabindex="-1"><strong>{{title}}</strong></button></th>
              <th><button type="button" class="btn btn-default btn-sm pull-right uib-right" ng-click="move(1)" tabindex="-1"><i aria-hidden="true" class="glyphicon glyphicon-chevron-right"></i><span class="sr-only">next</span></button></th>
            </tr>
            <tr>
              <th ng-if="showWeeks" class="text-center h6"><em>W</em></th>
              <th ng-repeat="label in ::labels track by $index" class="text-center"><small aria-label="{{::label.full}}">{{::label.abbr}}</small></th>
            </tr>
          </thead>
          <tbody>
            <tr class="uib-weeks" ng-repeat="row in rows track by $index" role="row">
              <td ng-if="showWeeks" class="text-center h6"><em>{{ weekNumbers[$index] }}</em></td>
              <td ng-repeat="dt in row" class="uib-day text-center" role="gridcell"
                id="{{::dt.uid}}"
                ng-class="::dt.customClass">
                <button type="button" class="btn btn-default btn-sm"
                  ng-class="::{'btn-muted': dt.secondary}"
                  uib-is-class="
                    'btn-info' for selectedDt,
                    'active' for activeDt
                    on dt"
                  ng-click="select(dt.date)"
                  ng-disabled="::dt.disabled"
                  tabindex="-1"><span ng-class="::{'text-muted': dt.secondary, 'text-info': dt.current}">{{::dt.label}}</span></button>
              </td>
            </tr>
          </tbody>
        </table>`);
}]);
