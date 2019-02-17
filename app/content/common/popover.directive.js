'use strict';

truedashApp.directive('tuPopover', (DeregisterService) => {
    return {
        restrict: 'A',
        scope: {
            tuPopoverDisabled: '='
        },
        link: function(scope, el, attrs) {
            let watchers = DeregisterService.create(scope);

            watchers.watch('tuPopoverDisabled', (disabled) => {
                if(disabled) {
                    $(el).popover('destroy');
                } else {
                    $(el).popover({
                        container: 'body',
                        trigger: 'hover',
                        html: true,
                        title: attrs.tuPopoverTitle,
                        content: () => attrs.tuPopoverHtml,
                        placement: 'auto ' + attrs.tuPopoverPlacement
                    });
                }
            });

            $(el).on("remove", () => $(el).popover('hide'));
            scope.$on("$destroy", () => $(el).popover('hide'));
            scope.$on('popover.hide', () => $(el).popover("hide"));
        }
    };
});
