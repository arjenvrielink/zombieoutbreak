var zoom = 7;
var map, layer;

function init(){
    
    /*
     * MAP SETUP
     */
    
    
    newRD = new OpenLayers.Projection('EPSG:28992'); // Nederland
    wgs84 = new OpenLayers.Projection('EPSG:4326');
    sphericalMercator = new OpenLayers.Projection('EPSG:900913'); // google

    var options = {
       projection : sphericalMercator,
       tileSize : new OpenLayers.Size(256, 256),
       units : "m",
    };

    map = new OpenLayers.Map( 'map', options );

    // replace "toner" here with "terrain" or "watercolor"
    var baseLayer = new OpenLayers.Layer.Stamen("toner");
    //var baseLayer = new OpenLayers.Layer.Stamen("watercolor");
    //var baseLayer = new OpenLayers.Layer.Stamen("terrain");
    map.addLayer(baseLayer);

    baseProjection = baseLayer.projection; 

    var geojson_format = new OpenLayers.Format.GeoJSON({
            'externalProjection': wgs84,
            'internalProjection': baseProjection});
    //var vector_layer = new OpenLayers.Layer.Vector(); 
    //vector_layer.addFeatures(geojson_format.read(spoor));
    //map.addLayer(vector_layer);

    var stationLayer = new OpenLayers.Layer.Vector();
    stationLayer.addFeatures(geojson_format.read(stations));
    map.addLayer(stationLayer);

    //map.addLayers([spoor_subset, stations]);
    //centermidden = new OpenLayers.LonLat(5.65, 52.30).transform(wgs84, sphericalMercator);
    //zoom = 9.5;
    //map.setCenter(centermidden, zoom);
    map.zoomToExtent(stationLayer.getDataExtent());


    /*
     * MAP CONTROLS
     */

    selectStation = new OpenLayers.Control.SelectFeature(stationLayer, {clickout: true});
    map.addControl(selectStation);
    //selectStation.onSelect(drawCircle());
    selectStation.activate();

    /*
     * LAYER EVENTS
     */

    // bind mouseclick event to station layer and fire callback function
    stationLayer.events.register('featureselected', this, drawCircle);


    // callback function for stationLayer clickevent
    function drawCircle (e) {
        console.log(e);
        var geometry = e.feature.geometry;
        var centroid = geometry.getCentroid();
        var lonLat = new OpenLayers.LonLat(centroid.x, centroid.y);
        var xy = map.getPixelFromLonLat(lonLat);
        alert(xy);

        // en dan nu wat magische raphael shizzle
    }
};
