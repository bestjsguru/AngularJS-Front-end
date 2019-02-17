'use strict';

truedashApp.controller('OrdersCtrl', function ($scope) {
    $scope.cities = [
        ['London', 'UK', -0.53, 51.31, 3600],
        ['Portsmouth', 'UK', -1.09, 50.81, 650],
        ['Plymouth', 'UK', -4.11, 50.38, 900],
        ['Sheffield', 'UK', -1.49, 53.38, 300],
        ['Manchester', 'UK', -2.23, 53.47, 1500],
        ['Dublin', 'UK', -6.25, 53.32, 2400],
        ['Belfast', 'UK', -6.26, 54.59, 1400],
        ['Limerick', 'UK', -8.63, 52.65, 1800],
        ['Galway', 'UK', -9.05, 53.27, 1100],
        ['Cork', 'UK', -8.46, 51.89, 1000],
        ['Glasgow', 'UK', -4.23, 55.85, 2200],
        ['Bristol', 'UK', -2.53, 51.46, 1800],
    	['LIverpool', 'UK', -2.91, 53.42, 2100],
    	['Birmingham', 'UK', -1.93, 52.31, 560],
        ['Madrid', 'Spain', -4.13, 40.31, 1700],
    	['Nis', 'Serbia', 21.93, 43.21, 200],
    	['Vienna', 'Serbia', 16.43, 48.21, 2650],
    	['Zurich', 'Switzerland', 8.43, 47.21, 1400],
    	['Bratislava', 'Slovakia', 17.17, 48.17, 700],
    	['Paris', 'France', 2.43, 48.91, 2900],
    	['Berlin', 'Germany', 13.43, 52.51, 3000],
    	['Warsaw', 'Poland', 21.73, 52.41, 1900],
    	['Prague', 'Czech Republic', 14.33, 50.21, 1350],
    	['Athens', 'Greece', 23.86, 38.01, 1430]
    ];
  });
