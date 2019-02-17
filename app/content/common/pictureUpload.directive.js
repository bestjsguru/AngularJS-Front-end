'use strict';


truedashApp.directive('tuPictureUpload', function ($parse, $window) {
    return {
        restrict: 'A', // only activate on element,
        scope: {
            fileButton: '@tuFileButton',
            imagePreview: '@tuImagePreview',
            file: '=tuFile'
        },
        link
    };

    function isFile(item) {
        return angular.isObject(item) && item instanceof $window.File;
    }

    function isImage(file) {
        var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
        return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
    }


    function link(scope, element, attr) {
        var support = !!($window.FileReader && $window.CanvasRenderingContext2D);
        //Upload button
        var fileButton = $(scope.fileButton);
        //Upload file input
        var fileInput = element;
        //img preview
        var imagePreview;

        fileButton.on('click', function (evt) {
            fileInput.click();
        });

        fileInput.on('change', function (evt) {
            var file = evt.target.files[0];
            if (!support) return;

            if (!isFile(file)) return;
            if (!isImage(file)) return;

            var reader = new FileReader();

            reader.onload = function (event) {
                if (!imagePreview)
                    imagePreview = $(scope.imagePreview);

                if (imagePreview) {
                    imagePreview.attr('src', event.target.result);
                }
            };
            reader.readAsDataURL(file);

            scope.$apply(function () {
                scope.file = file;
            })
        });
    }
});
