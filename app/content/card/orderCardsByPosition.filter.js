truedashApp.filter('orderCardsByPosition', function() {
    return function(cards) {
        if(!cards || !cards.length) return cards;
        return cards.sort(function(a, b) {
            var aPos = a.positioning.position,
                bPos = b.positioning.position;
            if(!aPos || !bPos) return 0;
            if(aPos.row != bPos.row) return aPos.row - bPos.row;
            if(aPos.col != bPos.col)return aPos.col - bPos.col;
            return 0;
        });
    };
});
