var zoom = 7;
var map, layer;

function init(){
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
    var baselayer = new OpenLayers.Layer.Stamen("toner");
    //var baselayer = new OpenLayers.Layer.Stamen("watercolor");
    //var baselayer = new OpenLayers.Layer.Stamen("terrain");
    map.addLayer(baselayer);

    baseProjection = baselayer.projection; 

    var geojson_format = new OpenLayers.Format.GeoJSON({
            'externalProjection': wgs84,
            'internalProjection': baseProjection});
    //var vector_layer = new OpenLayers.Layer.Vector(); 
    //vector_layer.addFeatures(geojson_format.read(spoor));
    //map.addLayer(vector_layer);

    var stations_layer = new OpenLayers.Layer.Vector();
    stations_layer.addFeatures(geojson_format.read(stations));
    map.addLayer(stations_layer);

    //map.addLayers([spoor_subset, stations]);
    //centermidden = new OpenLayers.LonLat(5.65, 52.30).transform(wgs84, sphericalMercator);
    //zoom = 9.5;
    //map.setCenter(centermidden, zoom);
    map.zoomToExtent(stations_layer.getDataExtent());
};
