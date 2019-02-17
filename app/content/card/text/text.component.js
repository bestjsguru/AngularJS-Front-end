'use strict';

class TextCtrl {
    constructor($sce) {
        this.text = "";
        this.$sce = $sce;
    }

    $onInit() {
        const unescaped = _.unescape(this.card.text);
        this.text = this.$sce.trustAsHtml(unescaped);
    }
}

truedashApp.component('tuText', {
    controller: TextCtrl,
    templateUrl: 'content/card/text/text.html',
    bindings: {
        card: '='
    },
    require: {
        cardComponent: '^?tuCard'
    }
});
