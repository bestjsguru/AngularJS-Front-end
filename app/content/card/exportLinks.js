'use strict';

export class ExportLinks {
    constructor(card) {
        this.links = [];
        this.card = card;
    }
    
    init() {
        if (!this.links) this.links = [];
        if (this.card.cardExportInfos) {
            this.links = _.cloneDeep(this.card.cardExportInfos);
        }
        
        this.links = _.uniqBy(this.links, link => link.id);
    }
    
    get zapier() {
        return this.links.filter(link => link.exportType === 'zapier');
    }
    
    get dexi() {
        return this.links.filter(link => link.exportType === 'dexi');
    }
}
