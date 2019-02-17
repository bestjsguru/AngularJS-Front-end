'use strict';

truedashApp.factory('Recurly', function () {
    var service = {
        init: init
    };
    var initialized = false;
    return service;

    function init() {
        if (initialized) return;
        initialized = true;
        loadRecurly();
    }

    function loadRecurly() {
        var el = document.createElement("script");
        el.type = "text/javascript";
        el.async = !0;
        el.src = "https://js.recurly.com/v3/recurly.js";
        el.onload = onLoad();
        var n = document.getElementsByTagName("script")[0];
        n.parentNode.insertBefore(el, n);
    }

    function onLoad() {
        console.log('---> loaded!');
    }
});
