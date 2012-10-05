var zoom = 7;
var map, layer;

function init(){
    
    /*
     * MAP SETUP
     */
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

    /*
     * RAPHAEL SETUP
     */ 

    // setup paper, top left corner hard coded
    // get position of the map div relative to the viewport
    var mapoffset = $('#map').offset();
    var paper = Raphael(mapoffset.left, mapoffset.top, map.getSize().w, map.getSize().h);
    //console.log(paper);
    // maybe this also works?
    //var paper = Raphael($('#map'), map.getSize().w, map.getSize().h);

    /*
     * THIS IS WHERE THE MAGIC HAPPENS
     */

    // callback function for stationLayer clickevent
    function drawCircle (e) {
        //console.log(e); // to check what is available in the event object: the feature, feature layer, should be xy but disabled by default in current OL
        var geometry = e.feature.geometry;
        var centroid = geometry.getCentroid();
        var lonLat = new OpenLayers.LonLat(centroid.x, centroid.y);
        var xy = map.getPixelFromLonLat(lonLat);
        console.log(xy.x, xy.y);

        // en dan nu wat magische raphael shizzle
        // draw something cool at the station position
        var circle = paper.circle(xy.x, xy.y, 20);
        circle.attr("fill", "#f00");
        circle.attr("stroke", "#fff");
        //paper.canvas.style.zIndex = "999"; // this works but then the canvas is on top of the other layers not allowing clickthroughs
        circle.node.style.zIndex = "999"; // this doesn't work because the canvas is still on top of it
    }
};
