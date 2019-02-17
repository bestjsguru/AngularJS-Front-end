'use strict';

import {EventEmitter} from '../../system/events.js';

class CardImage extends EventEmitter {
    constructor(card) {
        super();

        this.card = card;
    }

    init(card) {

        if(!card.image) card.image = {};

        this.url = card.image.imageUrl;
        this.opacity = _.isNumber(card.image.opacity) ? card.image.opacity : 100;
        this.vertical = card.image.vertical ? card.image.vertical.toLowerCase() : '';
        this.horizontal = card.image.horizontal ? card.image.horizontal.toLowerCase() : '';
        this.displayType = card.image.displayType ? card.image.displayType.toLowerCase() : '';
    }

    getJson() {
        if(!this.url) return null;

        return {
            imageUrl: this.url,
            opacity: this.opacity,
            vertical: this.vertical ? this.vertical.toUpperCase() : null,
            horizontal: this.horizontal ? this.horizontal.toUpperCase() : null,
            displayType: this.displayType ? this.displayType.toUpperCase() : null,
        };
    }

    cssStyle() {
        let style = {
            'background-image': 'url(' + this.url + ')',
            'background-repeat': this.displayType === 'tile' ? 'repeat' : 'no-repeat',
            'background-position': `${this.horizontal} ${this.vertical}`,
            'background-size': this.getBackgroundSize(),
            'background-color': 'white'
        };

        let opacity = 1 - (this.opacity > 0 ? this.opacity / 100 : 0);
        
        style['box-shadow'] = `inset 0px 0px 1000px 1000px rgba(255,255,255,${opacity})`;
        style['-moz-box-shadow'] = `inset 0px 0px 1000px 1000px rgba(255,255,255,${opacity})`;
        style['-webkit-box-shadow'] = `inset 0px 0px 1000px 1000px rgba(255,255,255,${opacity})`;

        return style;
    }

    getBackgroundSize() {
        if(this.displayType === 'stretch') return '100% 100%';
        if(this.displayType === 'fit') return 'contain';

        return 'initial';
    }

    getState() {
        return {
            url: this.url,
            opacity: this.opacity,
            vertical: this.vertical,
            horizontal: this.horizontal,
            displayType: this.displayType
        };
    }

    setState(state) {
        this.url = state.url;
        this.opacity = state.opacity;
        this.vertical = state.vertical;
        this.horizontal = state.horizontal;
        this.displayType = state.displayType;
    }

    exists() {
        return !!this.url;
    }
}

truedashApp.service('CardImageFactory', () => ({
    create: (card) => new CardImage(card)
}));
