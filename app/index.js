'use strict';

window.axios = require('axios');
require('babel-polyfill');

window['moment-range'].extendMoment(moment);

import './content/common/string';
import './content/nonBower/angular-perfect-scrollbar';
import './styles/templates/ui-tpls';
import './content/app';

import './styles/templates/error-messages';
import './content/routes';
import './content/shortcuts';

import './content/cache/cache.service';
import './content/cache/cardCacheHelper.service';
import './content/cache/dashboardCacheHelper.service';
import './content/cache/folderCacheHelper.service';
import './content/cache/organisationCacheHelper.service';
import './content/cache/userCacheHelper.service';
import './content/cache/relationshipCacheHelper.service';
import './content/cache/metricCacheHelper.service';
import './content/cache/tableCacheHelper.service';
import './content/cache/columnCacheHelper.service';
import './content/common/validateMultipleEmails.directive';
import './content/nonBower/confirm.directive';
import './content/common/ajax.directive';
import './content/common/dateRange.service';
import './content/common/dataProvider.service';
import './content/common/userSelector.directive';
import './content/common/dateTimePicker.directive';
import './content/common/authorize';
import './content/common/updateDate.directive';
import './content/common/datePicker.directive';
import './content/common/pictureUpload.directive';
import './content/common/popover.directive';
import './content/common/toaster/toaster.service';
import './content/common/toaster/notificationMessage.service';
import './content/common/format.filter';
import './content/common/abs.filter';
import './content/common/value.filter';
import './content/common/capitalize.filter';
import './content/common/deregisterService.service';
import './content/common/calendar.directive';
import './content/common/dateTime.filter';
import './content/common/services/appEvents.service';
import './content/common/services/churnzero.service';
import './content/common/services/analyticsSegment.service';
import './content/common/services/pusher.service';
import './content/common/services/trueTag.service';
import './content/common/services/desk.service';
import './content/common/services/newRelic.service';
import './content/common/services/appcues.service';
import './content/common/services/branch.service';
import './content/common/services/fullstory.service';
import './content/common/services/delighted.service';
import './content/common/services/freshchat.service';
import './content/common/customSearch.filter';

import './content/common/uiSelectRequired.directive';

import './content/common/inputRange.directive';

import './content/session/auth.directive';
import './content/session/auth.service';
import './content/session/redirect.service.js';
import './content/session/login/login.component';
import './content/session/login/loginCallback.component';

import './content/session/token/token.service';
import './content/session/token/tokenCallback.component';

import './content/home/home.component';
import './content/home/favouriteCards/favouriteDashboard.service';

import './content/columnValueDropdown/columnValueDropdown.component';
import './content/multiselectDropdown/multiselectDropdown.component';

import './content/card/card.directive';
import './content/card/totals/totals.directive';
import './content/card/orderCardsByPosition.filter';
import './content/card/visual.component';
import './content/card/footer/cardFooter.component';
import './content/card/pagination/cardPagination.component';
import './content/card/dataExport.service';
import './content/card/model/metric.service';
import './content/card/cardTable.service';
import './content/card/model/cardPositioning';
import './content/card/card.fullInfoLoading.service';

import './content/card/clone/cloneCard.directive';

import './content/card/numeric/numeric.component';
import './content/card/text/text.component';
import './content/card/datatable/datatableTransformer';
import './content/card/datatable/pagination/paginationText.component';
import './content/card/datatable/datatable.component';
import './content/card/datatable/comparableCell.component';
import './content/card/datatable/commoncell/commonCell.directive';
import './content/card/datatable/pagination/horizontalPagination.component';

import './content/card/explore/explore.component';
import './content/card/explore/drillBreadcrumbs.component';

import './content/alertSubscribers/alertSubscribers.directive';
import './content/alerts/alerts';
import './content/alerts/alertSubscription';
import './content/alerts/alerts.component';
import './content/subscribeTimetable/subscribeTimetable.directive';

// new card builder
import './content/builder/cardBuilder.component';
//text card builder
import './content/builder/textCardBuilder/textCardBuilder.component.js';

import './content/card/model/cardCohort';

import './content/anomalyDetection/anomalyDetection.component';
import './content/anomalyDetection/anomalyDetection.service';
import './content/anomalyDetection/anomaly.factory';

//metric builder
import './content/metricBuilder/metricBuilder.directive.js';
import './content/metricBuilder/metricList/metricList.directive.js';
import './content/metricBuilder/metricVisual/metricVisual.directive.js';
import './content/metricBuilder/affectedCards/affectedCards.component.js';
import './content/metricBuilder/affectedPeople/affectedPeople.component.js';
import './content/metricBuilder/metricData/metricData.directive.js';
import './content/metricBuilder/metricData/sqlMetricValidator.directive.js';
import './content/metricBuilder/metricData/metricData.service.js';
import './content/metricBuilder/metricFilters/metricFilters.component.js';
import './content/metricBuilder/metricFilters/metricFilters.js';
import './content/metricBuilder/query/statement/queryStatement.component.js';
import './content/metricBuilder/query/sql/querySql.directive.js';
import './content/metricBuilder/metricData/table.model.js';
import './content/metricBuilder/availableColumns/availableColumns.directive.js';
import './content/metricBuilder/metricPreview/metricPreview.component.js';
import './content/metricBuilder/availableColumns/availableColumns.service.js';
import './content/metricBuilder/metricData/metricData.model.js';
import './content/metricBuilder/cloneManager/cloneManager.service.js';


import './content/schemaDesign/schemaDesign.component';
import './content/schemaDesign/dataSource.component';
import './content/schemaDesign/schemaViewer.component';
import './content/schemaDesign/dbEntity.component';
import './content/schemaDesign/tableRelation.service';
import './content/schemaDesign/tableRelation.model';
import './content/schemaDesign/connection.filter';
import './content/schemaDesign/plumb.service';
import './content/schemaDesign/connection.collection';
import './content/schemaDesign/schemaDesign.service';

import './content/dashboard/folder/dashboardFolder.model';
import './content/dashboard/folder/dashboardFolder.service';
import './content/dashboard/folder/dashboardFolder.collection';
import './content/profile/dashboards/organizeDashboards.component';
import './content/dashboard/shareDashboard.directive';
import './content/dashboard/dashboard.component';
import './content/dashboard/addDashboard.directive';
import './content/dashboard/customiseDashboard.directive';
import './content/dashboard/emailReport/emailReport.directive';
import './content/dashboard/copyDashboard.directive';
import './content/dashboard/filters/addDashboardFilter.directive';
import './content/dashboard/filters/dashboardFilters.service';
import './content/dashboard/filters/dashboardFilters';
import './content/dashboard/dashboardsList/availableDashboardFilters/availableDashboardFilters.directive';
import './content/dashboard/dashboard.model';
import './content/dashboard/addDashboardModal.service';
import './content/dashboard/customiseDashboardModal.service';
import './content/dashboard/dashboardCollection.service';
import './content/dashboard/permissions.directive';
import './content/dashboard/dashboardReport.service';
import './content/dashboard/dashboardsList/dashboardsList.component';
import './content/dashboard/dashboard.model';
import './content/dashboard/dashboardCards';
import './content/dashboard/dashboardUsers';
import './content/dashboard/dashboardsPage.component';
import './content/dashboard/slideshow/dashboardSlideshow.component';

import './content/profile/organisation/ensureUniqueUsernames.directive';
import './content/profile/organisation/inviteMembers.directive';
import './content/profile/user.service';
import './content/profile/organisation/organisation.service';
import './content/profile/organisation/organisation.component';
import './content/profile/organisation/organisationMembers.component';
import './content/profile/organisation/userPermissions/userPermissions.component';
import './content/profile/details/details.directive';
import './content/profile/alert/alert.filter';
import './content/profile/alert/profileAlerts.directive';
import './content/profile/report/profileReports.directive';
import './content/profile/report/report.filter';
import './content/profile/activity/activity.directive';
import './content/profile/organisation/userPermissions/folderSettings.service.js';

import './content/layout/index.controller';
import './content/layout/sidebar/sidebar.component';

import './content/map/ordersMap.directive';
import './content/map/orders.controller';
import './content/map/ukMap.directive';

import './content/map/geoMap.component';

import './content/automationBuilder/automationBuilder.component';
import './content/automationBuilder/automationBuilder.component';
import './content/automationBuilder/automation/automation.service';

import './content/relationshipBuilder/relationshipBuilder.component';

import './content/rootCause/rootCause.component';
import './content/rootCause/impact/impact.factory';

import './content/machineLearning/forecastAnalysis/forecastAnalysis.component';
import './content/machineLearning/forecastAnalysis/impact/impact.factory';

import './content/machineLearning/keyDrivers/keyDrivers.component';
import './content/machineLearning/keyDrivers/impact/impact.factory';

import './content/sentenceBuilder/sentenceBuilder.component';
import './content/sentenceBuilder/apiai/apiai.component';

import './content/smartAlerts/smartAlerts.component';

import './content/databaseExplorer/databaseExplorer.component';

import './content/dataQuality/feeds/feeds.component';

import './content/dataset/dataSource/dataSource.component';
import './content/dataset/dataSource/dataSource.service';

import './content/dataset/insight/insight.component';

import './content/common/recurly.service';
import './content/common/isDev.directive';

import './content/data/data.service';
import './content/card/model/card.factory';
import './content/card/annotations/annotations.factory';
import './content/card/model/cardMetrics';
import './content/card/model/cardDrill';
import './content/card/model/cardFilters';
import './content/card/model/cardTypes';
import './content/card/model/cardFrequencies';
import './content/card/model/cardFormulas';
import './content/card/model/cardGroupings';
import './content/card/model/cardCompare';
import './content/card/model/cardImage';
import './content/system/date.service';

import './content/embed/cardEmbed.component';

// New tables
import './content/new/tables/newTables.component';
