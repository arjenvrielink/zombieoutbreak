/*global requirejs, require, OpenLayers, jQuery, $, Raphael, stations, console  */
/*jslint indent: 4 */
"use strict";
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
    },
    shim: {
        'bootstrap' : {
            'deps' : ['jquery']
        },
        'stamen' : {
            'deps' : ['openlayers']
        }
    }
});
require(['jquery', 'bootstrap', 'openlayers', 'stamen', 'utrechtspoor', 'stations'], function ($) {

    /*
     * MAP SETUP
     */
	
	//_.each([1, 2, 3], alert);

    var map, layer, wgs84, sphericalMercator, options, baseLayer, baseProjection, geojson_format, stationLayer, selectStation, mapoffset, paper, infectedFeatures;

    wgs84 = new OpenLayers.Projection('EPSG:4326');
    sphericalMercator = new OpenLayers.Projection('EPSG:900913'); // google

    options = {
        projection : sphericalMercator,
        tileSize : new OpenLayers.Size(256, 256),
        units : "m"
    };

    map = new OpenLayers.Map('map', options);
    
	map.getControlsByClass('OpenLayers.Control.Navigation')[0].disableZoomWheel();

    // replace "toner" here with "terrain" or "watercolor"
    //var baseLayer = new OpenLayers.Layer.OSM();
    var baseLayer = new OpenLayers.Layer.Stamen("toner");
    //var baseLayer = new OpenLayers.Layer.Stamen("watercolor");
    //var baseLayer = new OpenLayers.Layer.Stamen("terrain");
    map.addLayer(baseLayer);

    baseProjection = baseLayer.projection;

    geojson_format = new OpenLayers.Format.GeoJSON({
        'externalProjection': wgs84,
        'internalProjection': baseProjection
    });
    
    //var vector_layer = new OpenLayers.Layer.Vector(); 
    //vector_layer.addFeatures(geojson_format.read(spoor));
    //map.addLayer(vector_layer);
    
    var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
	renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;

    stationLayer = new OpenLayers.Layer.Vector('Points',{
		styleMap: new OpenLayers.StyleMap({
			pointRadius: "5", 
			fillColor: "#00FF8C"
		}),
		renderers: renderer
	});
    stationLayer.addFeatures(geojson_format.read(stations));
    map.addLayer(stationLayer);
    map.zoomToExtent(stationLayer.getDataExtent());

    /*
     * MAP CONTROLS
     */

    selectStation = new OpenLayers.Control.SelectFeature(stationLayer, {clickout: true});
    map.addControl(selectStation);
    selectStation.activate();

    /*
     * RAPHAEL SETUP
     */

    // setup paper, top left corner hard coded
    // get position of the map div relative to the viewport
    mapoffset = $('#map').offset();
    paper = new Raphael(mapoffset.left, mapoffset.top, map.getSize().w, map.getSize().h);
    paper.canvas.style.zIndex = "999"; // bring the Raphael canvas to the top so you can actually see what raphael is drawing for you
    paper.canvas.style.pointerEvents = "none"; // set pointerEvents to none so the OL layer remains clickable; that means OL is handling clickevents, passing them to Raphael

    /*
     * THIS IS WHERE THE MAGIC HAPPENS
     */

    // ugly declaration of global vars
    infectedFeatures = []; // array with stations already infected

    // function that animates explosion at station position
    function bombStation(feature) {
        var centroid, lonLat, xy, circle;
        centroid = feature.geometry.getCentroid();
        lonLat = new OpenLayers.LonLat(centroid.x, centroid.y);
        xy = map.getPixelFromLonLat(lonLat);

        // en dan nu wat magische raphael shizzle
        // draw something cool at the station position
        circle = paper.circle(xy.x, xy.y, 10).animate({fill: "#f00", stroke: "#f99", "stroke-width": 10, "stroke-opacity": 0.6, opacity: 0.9}, 2500, "linear");
    }
    
    function connectStations(source,target) {
    	var centroid, sourcelonLat, targetlonLat, sourceXy, targetXy, pathString, path;
        centroid = source.geometry.getCentroid();
        sourcelonLat = new OpenLayers.LonLat(centroid.x, centroid.y);
        sourceXy = map.getPixelFromLonLat(sourcelonLat);
        
        centroid = target.geometry.getCentroid();
        targetlonLat = new OpenLayers.LonLat(centroid.x, centroid.y);
        targetXy = map.getPixelFromLonLat(targetlonLat);
        
        pathString = "M" + sourceXy.x + "," + sourceXy.y + "S" + ( targetXy.x + 20 ) + "," + ( targetXy.y + 20 ) + "," + targetXy.x + "," + targetXy.y;
        path = paper.path(pathString).attr({stroke: "#ff0000"});
       // path.animate({fill: "#f00", stroke: "#f99", "stroke-width": 10, "stroke-opacity": 0.6, opacity: 0.9}, 2500, "linear");
        path.glow({width: 20, color: "#ff0000"});
        //console.log(pathString);
    	
    }

    // function that finds the nearest stations and drops a zombiebomb
    // from the set of nearest stations, randomly n - 1 are selected and a new outbreak is calculated
    var targetFeatures;
    function virusSpread(sourceFeature) {
        var searchRadius, sourceBounds, searchBounds, targetFeature;
        console.log('virus spreading');
        // find features within x km from source feature 
        // get bounds + 30 km and see which feature geometries from layer intersect
        searchRadius = 50000; // search Radius in m
        sourceBounds = sourceFeature.geometry.bounds;
        searchBounds = new OpenLayers.Bounds(sourceBounds.left - searchRadius, sourceBounds.bottom - searchRadius, sourceBounds.right + searchRadius, sourceBounds.top + searchRadius);

        targetFeatures = [];
        console.log(infectedFeatures);
        infectedFeatures.push(sourceFeature); // list of features already infected, can be skipped
        for (var i = 0; i < sourceFeature.layer.features.length; i += 1) {
            targetFeature = sourceFeature.layer.features[i];
            // check if intersects and add to targetlist
            if (searchBounds.intersectsBounds(targetFeature.geometry.bounds)) {
                console.log('added target' + i + '; calculating distance');
                //calculate distance to target
                targetFeature.distanceToSource = sourceFeature.geometry.distanceTo(targetFeature.geometry);
                targetFeatures.push(targetFeature);
            }
        }

        if (targetFeatures.length == 1) { return; }
        //console.log(targetFeatures);
        targetFeatures = _.sortBy(targetFeatures,"distanceToSource");
        
        console.log(targetFeatures.length + ' targets found; attacking');

        // loop over targets not yet infected; intersect targetFeatures array with infectedFeatures
        //console.log(infectedFeatures.length);
        for (var i = 0; i < targetFeatures.length; i += 1) {
            targetFeature = targetFeatures[i];
            if (!_.contains(infectedFeatures,targetFeature)) {
                (function (feature) {
                    var delay = parseInt(feature.distanceToSource) / 10;
                    setTimeout(
                    		function () {
                    			bombStation(feature);
                    			connectStations(sourceFeature,feature);
                    			infectedFeatures.push(targetFeature);
                    		}, delay);
                    
                })
                
                (targetFeature);
                //bombStation(targetFeature);
                
                
            }
        }
        
        var finalTarget = targetFeatures[targetFeatures.length - 1];
        var delay = parseInt(finalTarget.distanceToSource) / 10;
        setTimeout(
        		function () {
        			virusSpread(finalTarget);
        		}, delay);
        //

        // if targetList = empty: return with 'all targets completed'

    }

    // function to get a geometry from an event and pass it on
    function getSelectedGeometry(e) {
        //console.log(e); // to check what is available in the event object: the feature, feature layer, should be xy but disabled by default in current OL
        bombStation(e.feature);
        virusSpread(e.feature);
    }

    /*
     * MAP & LAYER EVENTS
     */

    // bind mouseclick event to station layer and fire callback function
    stationLayer.events.register('featureselected', this, getSelectedGeometry);

    // map opschonen als die veranderd want dan kloppen de raphael coordination niet meer
    map.events.register('move', this, function (e) { paper.clear(); });

}); // close require()
