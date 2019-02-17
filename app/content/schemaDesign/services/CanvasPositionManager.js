const TOP_OFFSET = 50;

//@todo: get from stylesheets.rules
const TABLE_WIN = {
    min_width: 300,
    min_height: 200 / 2,
    margin: 10 //dynamic
};

export class CanvasPositionManager {
    constructor(parentElement) {
        this.$element = parentElement;
    }

    get canvas(){
        return this.$element.find('div.jtk-demo-canvas');
    }

    _getTableCanvasPosition(event){
        var offset = this.canvas.offset(),
            panel = $('.panel.panel-default');

        let top = event.top - offset.top - TOP_OFFSET + this.canvas.scrollTop();
        let left = event.left - panel.width() - offset.left + this.canvas.scrollLeft();

        return {
            top: top < 0 ? 0 : top,
            left: left < 0 ? 0 : left
        };
    }

    _getCatchedElRelatedOffset(eventPositions, order, total){
        var position = this._getTableCanvasPosition(eventPositions);

        var relatedBlockHeight = TABLE_WIN.min_height * total + TABLE_WIN.margin * (total-1);
        var topOffset = relatedBlockHeight/2;

        var isLast = !!(total - (order+1));

        if(total !== 1){
            if((position.top - topOffset) >= 0){
                position.top -= topOffset;
            }

            position.top +=  (TABLE_WIN.min_height + TABLE_WIN.margin * isLast)*order;
        }

        position.left += TABLE_WIN.min_width + TABLE_WIN.margin;

        return position;
    }
}
