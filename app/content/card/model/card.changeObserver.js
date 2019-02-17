export class CardChangeObserver {

    hasChanged(){
        return this.card && !angular.equals(
            this.card.getJson(),
            this.initState
        );
    }

    observe(card){
        this.card = card;
        this.initState = card.getJson();
    }
}
