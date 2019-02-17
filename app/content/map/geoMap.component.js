class GeoMapCtrl {

    constructor($element, $scope, DataProvider, DeregisterService, $rootScope, $timeout) {
        this.$element = $element;
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.DataProvider = DataProvider;
        this.$timeout = $timeout;
        this.setDimensions();
        this.watchers = DeregisterService.create($scope);

        this.watchers.onRoot('resize', () => this.watchers.timeout(() => this.setDimensions(), 50));
        this.init();
    }

    $postLink() {
        this.watchers.watch('$ctrl.loading', loading => {
            let element = this.$element.find('> div');

            if (loading) {
                element.addClass('chart-loading');
            } else  {
                this.watchers.timeout(() => {
                    element.removeClass('chart-loading');
                }, 6000);
            }
        });
    }

    $onInit() {
        this.loading = true;
        if (this.tuCard) {
            this.card.metrics.load().then(result => {
                this.drawMarkers();
            }).catch(error => {
                this.onMapDrown();
            });
        } else {
            this.drawMarkers();
        }
    }

    init() {

        this.markers = [];

        this.legend = {};

        this.defaults = {
            layers: {
                baselayers: {
                    googleRoadmap: {
                        name: 'Google Streets',
                        layerType: 'ROADMAP',
                        type: 'google'
                    },
                    googleTerrain: {
                        name: 'Google Terrain',
                        layerType: 'TERRAIN',
                        type: 'google'
                    },
                    googleHybrid: {
                        name: 'Google Hybrid',
                        layerType: 'HYBRID',
                        type: 'google'
                    }
                }
            }
        };

        this.center = {
            lat: 54.505,
            lng: -0.09,
            zoom: 5
        };
    }

    setDimensions() {
        this.width = this.$element.parent().width();
        this.height = this.$element.parent().height();
    }

    drawOverlay(data = [], map = this.map) {

        let markers = data.map(item => {
            return {
                postCode: item[0],
                numberOfOrders: item[1]
            };
        });

        if (markers.length > 0) {
            d3.json(`content/nonBower/uk-map.json`, (error, collection) => {

                collection.features.forEach(item => {
                    item.properties.orders = 0;
                });

                collection.features.forEach(f => {
                    let postCode = f.id;
                    let markerList = markers.filter(marker => marker.postCode.indexOf(postCode) === 0);

                    markerList.forEach(m => {
                        if (m && !_.isNaN(+m.numberOfOrders)) {
                            const secondLetter = m.postCode.slice(1, 2);
                            if (postCode.length === 1) {
                                if (!_.isNaN(+secondLetter)) {
                                    f.properties.orders += m.numberOfOrders;
                                }
                            } else {
                                f.properties.orders += m.numberOfOrders;
                            }
                        }
                    });

                });

                let numbers = collection.features.map(f => f.properties.orders);
                let ratio = Math.max(...numbers) / 100;

                collection.features.forEach(f => {
                    f.properties.density = Math.round(f.properties.orders / ratio);
                });

                this.geojson = {
                    data: collection,
                    style: this.style,
                    resetStyleOnMouseout: true
                };

                this.legend = {
                    colors: ['#800026', '#BD0026', '#E31A1C', '#FC4E2A', '#FD8D3C', '#FEB24C', '#FED976', '#FFEDA0'],
                    labels: [
                        this.legendLabelGenerator(90, 100, ratio),
                        this.legendLabelGenerator(80, 90, ratio),
                        this.legendLabelGenerator(70, 80, ratio),
                        this.legendLabelGenerator(60, 70, ratio),
                        this.legendLabelGenerator(40, 60, ratio),
                        this.legendLabelGenerator(20, 40, ratio),
                        this.legendLabelGenerator(10, 20, ratio),
                        this.legendLabelGenerator(0, 10, ratio)
                    ]
                };

                this.onMapDrown();
            });
        } else {
            this.onMapDrown();
        }

    }

    legendLabelGenerator(from, to, ratio) {
        return Math.ceil(from * ratio) + ' - ' + Math.ceil(to * ratio);
    }

    countryClick(feature, event) {
    }

    countryMouseover(feature, leafletEvent) {
        var layer = leafletEvent.target;
        layer.setStyle({
            weight: 2,
            color: '#666',
            fillColor: 'white'
        });
        layer.bringToFront();
        this.feature = feature;
    }

    countryMouseout() {
        this.feature = null;
    }

    drawMarkers() {
        let data = this.transformDataFromCard();
        if (this.tuCard !== null) {
            this.chooseChart(data);
        } else {
            if (data.length === 0) {
                let promise = this.card.isVirtual() ? this.card.metrics.getLoadDataPromise() : this.card.metrics.getLoadPromise();
                
                promise.then(response => {
                    data = this.transformDataFromCard();
                    this.chooseChart(data);
                }).finally(() => this.onMapDrown());
            } else {
                data = this.transformDataFromCard();
                this.chooseChart(data);
            }
        }
    }

    transformDataFromCard() {
        return this.card.metrics.get(0).data.map(item => [item[0].replace(/\["/gi, '').replace(/"\]/gi, ''), item[1]]);
    }

    chooseChart(data) {

        if(data && data.length > 0 && angular.isString(data[0][1])) {
            data.forEach(item => {
                item[1] = +item[1];
            });
        }

        if (this.card.types.subType === "heat") {
            this.$scope.$on("leafletDirectiveGeoJson.mouseout", (ev, leafletPayload) => {
                this.countryMouseout();
            });

            this.$scope.$on("leafletDirectiveGeoJson.mouseover", (ev, leafletPayload) => {
                this.countryMouseover(leafletPayload.leafletObject.feature, leafletPayload.leafletEvent);
            });

            this.$scope.$on("leafletDirectiveGeoJson.click", (ev, leafletPayload) => {
                this.countryClick(leafletPayload.leafletObject.feature, leafletPayload.leafletEvent);
            });
            this.drawOverlay(data);
        } else {
            this.googleMapMarkers(data);
        }
    }

    getLabelData() {
       return this.feature.name + ': ' + (this.feature.properties.orders || '0');
    }


    googleMapMarkers(data) {
        this.DataProvider.post('geoPostCode/hitGeoCodeApiBulk', data.map(row => row[0]))
            .then(response => {
                this.markers.length = 0;

                for (var i in response) {
                    let responseItem = response[i];
                    if (_.isEmpty(responseItem)) continue;

                    let orderCount = data.find(item => item[0] == i);
                    let postCode = orderCount[0];
                    let numberOfOrders = orderCount[1];

                    this.markers.push({
                        lat: parseFloat(responseItem.wgs84.lat),
                        lng: parseFloat(responseItem.wgs84.lon),
                        focus: false,
                        message: orderCount ? `${i} - ${numberOfOrders} orders` : i,
                        draggable: false,
                        postCode: postCode,
                        numberOfOrders: numberOfOrders
                    });
                }
            }).finally(()=>this.onMapDrown());
    }

    onMapDrown() {
        this.loading = false;
        this.$rootScope.$emit('resize');
    }

    style(feature) {
        let d = feature.properties.density;
        return {
            fillColor: d > 90 ? '#800026' :
                d > 80  ? '#BD0026' :
                    d > 70  ? '#E31A1C' :
                        d > 60  ? '#FC4E2A' :
                            d > 40   ? '#FD8D3C' :
                                d > 20   ? '#FEB24C' :
                                    d > 10   ? '#FED976' :
                                        '#FFEDA0',
            weight: 2,
            opacity: d > 0 ? 0.5 : 0,
            color: 'white',
            dashArray: '3',
            fillOpacity: d > 0 ? 0.6 : 0
        };
    }
}

truedashApp.component('tuGeoMap', {
    controller: GeoMapCtrl,
    templateUrl: 'content/map/geoMap.html',
    bindings: {
        card: '='
    },
    require: {
        tuCard: '^?tuCard'
    }
});

