truedashApp.directive('updateDate', function ($filter) {
    return {
        restrict: 'A',
        link: function (scope, el, attr) {
            function update(date, format) {
                date = new Date;
                date = $filter('date')(date, 'MMM d, y h:mm:ss a');
                el.text(date);
            }

            update();
            setInterval(update, 900000);
        }
    };
});
