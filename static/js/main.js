requirejs.config({
    paths: {
        // libs
        'jquery' : 'lib/jquery',
        'bootstrap': 'lib/bootstrap',
        'openlayers': 'lib/OpenLayers',
        //'raphael' : 'lib/raphael', // werkt nog niet met requirejs
        'stamen': 'http://maps.stamen.com/js/tile.stamen',
        // data
        'utrechtspoor' : 'data/utrechtspoor',
        'stations' : 'data/stations'
    }
});
//require(['jquery', 'bootstrap', 'openlayers', 'stamen', 'raphael'], function ($, Raphael) {
require(['jquery', 'bootstrap', 'openlayers', 'stamen', 'utrechtspoor', 'stations'], function ($) {

    /*
     * MAP SETUP
     */
    
    var zoom = 7;
    var map, layer;

    wgs84 = new OpenLayers.Projection('EPSG:4326');
    sphericalMercator = new OpenLayers.Projection('EPSG:900913'); // google

    var options = {
       projection : sphericalMercator,
       tileSize : new OpenLayers.Size(256, 256),
       units : "m",
    };

    map = new OpenLayers.Map( 'map', options );

    // replace "toner" here with "terrain" or "watercolor"
    //var baseLayer = new OpenLayers.Layer.OSM();
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
    stationLayer.events.register('featureselected', this, getSelectedGeometry);

    /*
     * RAPHAEL SETUP
     */ 

    // setup paper, top left corner hard coded
    // get position of the map div relative to the viewport
    var mapoffset = $('#map').offset();
    var paper = Raphael(mapoffset.left, mapoffset.top, map.getSize().w, map.getSize().h);
    paper.canvas.style.zIndex = "999"; // bring the Raphael canvas to the top so you can actually see what raphael is drawing for you
    paper.canvas.style.pointerEvents = "none"; // set pointerEvents to none so the OL layer remains clickable; that means OL is handling clickevents, passing them to Raphael

    /*
     * THIS IS WHERE THE MAGIC HAPPENS
     */

    // function to get a geometry from an event and pass it on
    function getSelectedGeometry (e) {
        //console.log(e); // to check what is available in the event object: the feature, feature layer, should be xy but disabled by default in current OL
        var geometry = e.feature.geometry;
        bombStation(geometry);
        virusSpread(geometry);
    }

    // function that animates explosion at station position
    function bombStation (geometry) {
        var centroid = geometry.getCentroid();
        var lonLat = new OpenLayers.LonLat(centroid.x, centroid.y);
        var xy = map.getPixelFromLonLat(lonLat);

        // en dan nu wat magische raphael shizzle
        // draw something cool at the station position
        var circle = paper.circle(xy.x, xy.y, 20);
        circle.attr("fill", "#f00");
        circle.attr("stroke", "#fff");
    }

    // function that finds the nearest stations and drops a zombiebomb
    // from the set of nearest stations, randomly n - 1 are selected and a new outbreak is calculated
    function virusSpread (geometry) {
        console.log('virus spreading');
        // find closest geometries in layer

        var centroid = geometry.getCentroid();
        var lonLat = new OpenLayers.LonLat(centroid.x, centroid.y);
        var xy = map.getPixelFromLonLat(lonLat);
    }
}); // close require()
