///////////////////////////////////////////////////////////////////////////////////////
/*
					D A T A   1
University of Delaware - Center for Applied Demography and Survey Research
Authors: David Racca, Tyler Apostolico, Muhammet Aydin, Scott Miller
May 2017

A simple ondemandgrid implementation used to store information calculated from
TransFilter and selectTrans. This is one of multiple grid widgets. 
*/
/////////////////////////////////////////////////////////////////////////////////////
define(['dojo/_base/declare',
        "dijit/_WidgetsInTemplateMixin",
        "jimu/BaseWidget",
        "jimu/dijit/TabContainer",
        'dojo/dom-attr',
        'dijit/form/CheckBox',
        "dijit/layout/ContentPane",
        'dijit/form/FilteringSelect',
        'jimu/dijit/Message', 
        'jimu/MapManager', 
        'jimu/filterUtils', 
        "jimu/utils",
        "esri/config",
        "esri/urlUtils",
        "esri/tasks/query",
        "esri/tasks/QueryTask",
        "esri/tasks/StatisticDefinition",
        "esri/tasks/Geoprocessor",
        "esri/tasks/FeatureSet",
        "esri/layers/GraphicsLayer",
        "esri/graphic",
        "esri/geometry/Point",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/PictureMarkerSymbol",
        "esri/geometry/Polyline",
        "esri/symbols/SimpleLineSymbol",
        "esri/geometry/Polygon",
        "esri/symbols/SimpleFillSymbol",
        "esri/toolbars/draw",
        "esri/InfoTemplate",
        "esri/request",
        "esri/graphicsUtils",
        "esri/geometry/webMercatorUtils",
        "dojo/_base/Color",
        "dijit/Dialog",
        "dijit/ProgressBar",
        "dijit/form/NumberSpinner",
        "dojo/_base/lang",
        "dojo/on",
        "dojo/dom",
        "dojo/dom-style",
        "dijit/form/Select",
        "dijit/form/TextBox",
        "esri/geometry/jsonUtils",
        "dojo/_base/array",
        "dojo/_base/html",
        "esri/tasks/RelationParameters",
        "esri/layers/FeatureLayer",
        "jimu/dijit/DrawBox",
        "dojo/store/Memory",
        "dgrid/OnDemandGrid",
        "dgrid/Selection",
        "dojo/query",
        "dojo/dom-construct",
        'jimu/dijit/ViewStack',
        'esri/symbols/jsonUtils',
        'dojo/promise/all',
        'dojo/Deferred',
        "esri/Color",
        'jimu/dijit/FeatureSetChooserForMultipleLayers',
        'jimu/LayerInfos/LayerInfos',
        'jimu/SelectionManager',
        'jimu/PanelManager',
        './layerUtil',
        './SelectableLayerItem',
        './FeatureItem',
        'jimu/dijit/LoadingShelter',
        "dgrid/Keyboard",
        "dojo/ready",
        "dojox/json/ref",
        "dgrid/Selection"

    ],
    function(declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, domAttr, CheckBox, ContentPane,
        FilteringSelect, Message, jimuUtils, MapManager, utils, esriConfig, urlUtils, Query, QueryTask, StatisticDefinition, Geoprocessor, FeatureSet,
        GraphicsLayer, Graphic, Point, SimpleMarkerSymbol, PictureMarkerSymbol, Polyline, SimpleLineSymbol,
        Polygon, SimpleFillSymbol, Draw, InfoTemplate, esriRequest, graphicsUtils, webMercatorUtils, Color,
        Dialog, ProgressBar, NumberSpinner, lang, on, dom, domStyle, Select, TextBox, jsonUtils,
        array, html, RelationParameters, FeatureLayer, DrawBox, Memory, OnDemandGrid, Selection, query, domConstruct,
        ViewStack, SymbolJsonUtils, all, Deferred, Color,
        FeatureSetChooserForMultipleLayers, LayerInfos, SelectionManager, PanelManager, layerUtil,
        SelectableLayerItem, FeatureItem, Keyboard, ready, ref, Selection) {
        return declare([BaseWidget, _WidgetsInTemplateMixin], {
            baseClass: 'jimu-widget-Data',
            name: 'Query Data',
            queryTask: null,
            somevar: 3,
            sometextvar: 'sometext',
            somearray: [],
            query: null,
            queryTask: null,
            theobjectid: 0,
            

            postMixInProperties: function() {
                this.inherited(arguments);
                lang.mixin(this.nls, window.jimuNls.common);
            },
            
            onOpen: function(){
                var panel = this.getPanel();
                var pos = panel.position;
                pos.width = 900;
                pos.height = 500;
                panel.setPosition(pos);
                panel.panelManager.normalizePanel(panel);
            },

            postCreate: function() {
                var grid = new OnDemandGrid({
                    selectionMode: "single",
                    bufferRows: Infinity,
                    cellNavigation: false
                }, "grid");
                on(this.getquery1, "click", lang.hitch(this, function() {
                    this.startup();
                }));
                on(this.csv, "click", lang.hitch(this, function() {
                    
                    var input = prompt("Enter a name for your file ('data.csv')", 'data.csv');
                    this.exportToCsv(input, window.rows);
                }));

                // End of postcreate 
            },

            //beginning of functions
            startup: function() {
                
                var s = document.getElementById("snackbar");
                console.log({s});
                s.innerHTML = "Status: Data1 widget opened";

                //this.queryTask = new QueryTask("https://cadsrgis2.org/arcgis/rest/services/trafdata/trafcnts/MapServer/0");
                this.query = new Query();
                this.query.orderByFieldsForStatistics = ["LRSID"]; // The default orderByField is LRSID
                this.query.where = "1 = 1 "; // where string is all road segments

                var yrticker;
                var dayticker;
                var monthticker;
                
                var selected = [];
                var string = "";
                var variables = {
                    year: [],
                    DOW: [], //day of week
                    month: [],
                    period: [],
                    interval: [],
                    hour: []
                };
                //pushing global var values into the 'selected' array
                if (window.yr2010ChkBx != 0) {
                    window.yr2010ChkBxvalue = 10;
                    selected.push(window.yr2010ChkBxname);
                    selected.push(window.yr2010ChkBxvalue);
                }
                if (window.yr2011ChkBx != 0) {
                    window.yr2011ChkBxvalue = 11;
                    selected.push(window.yr2011ChkBxname);
                    selected.push(window.yr2011ChkBxvalue);
                }
                if (window.yr2012ChkBx != 0) {
                    window.yr2012ChkBxvalue = 12;
                    selected.push(window.yr2012ChkBxname);
                    selected.push(window.yr2012ChkBxvalue);
                }
                if (window.yr2013ChkBx != 0) {
                    window.yr2013ChkBxvalue = 13;
                    selected.push(window.yr2013ChkBxname);
                    selected.push(window.yr2013ChkBxvalue);
                }
                if (window.yr2014ChkBx != 0) {
                    window.yr2014ChkBxvalue = 14;
                    selected.push(window.yr2014ChkBxname);
                    selected.push(window.yr2014ChkBxvalue);
                }
                if (window.yr2015ChkBx != 0) {
                    window.yr2015ChkBxvalue = 15;
                    selected.push(window.yr2015ChkBxname);
                    selected.push(window.yr2015ChkBxvalue);
                }
                if (window.yr2016ChkBx != 0) {
                    window.yr2016ChkBxvalue = 16;
                    selected.push(window.yr2016ChkBxname);
                    selected.push(window.yr2016ChkBxvalue);
                }
                if (window.yr2017ChkBx != 0) {
                    window.yr2017ChkBxvalue = 17;
                    selected.push(window.yr2017ChkBxname);
                    selected.push(window.yr2017ChkBxvalue);
                }
//                if (window.wkdayChkBx != 0) {
//                    window.wkdayChkB
//                    selected.push(window.wkdayChkBxname);
//                    selected.push(window.wkdayChkBxvalue);
//                }
//                if (window.wkendChkBx != 0) {
//                    
//                    selected.push(window.wkendChkBxname);
//                    selected.push(window.wkendChkBxvalue);
//                }
                if (window.monChkBx != 0) {
                    window.monChkBxvalue = 1;
                    selected.push(window.monChkBxname);
                    selected.push(window.monChkBxvalue);
                }
                if (window.tuesChkBx != 0) {
                    window.tuesChkBxvalue = 2;
                    selected.push(window.tuesChkBxname);
                    selected.push(window.tuesChkBxvalue);
                }
                if (window.wedChkBx != 0) {
                    window.wedChkBxvalue = 3;
                    selected.push(window.wedChkBxname);
                    selected.push(window.wedChkBxvalue);
                }
                if (window.thurChkBx != 0) {
                    window.thurChkBxvalue = 4;
                    selected.push(window.thurChkBxname);
                    selected.push(window.thurChkBxvalue);
                }
                if (window.friChkBx != 0) {
                    window.friChkBxvalue = 5;
                    selected.push(window.friChkBxname);
                    selected.push(window.friChkBxvalue);
                }
                if (window.satChkBx != 0) {
                    window.satChkBxvalue = 6;
                    selected.push(window.satChkBxname);
                    selected.push(window.satChkBxvalue);
                }
                if (window.sunChkBx != 0) {
                    window.sunChkBxvalue = 7;
                    selected.push(window.sunChkBxname);
                    selected.push(window.sunChkBxvalue);
                }

                if (window.janChkBx != 0) {
                    window.janChkBxvalue = 1;
                    selected.push(window.janChkBxname);
                    selected.push(window.janChkBxvalue);
                }
                if (window.febChkBx != 0) {
                    window.febChkBxvalue = 2;
                    selected.push(window.febChkBxname);
                    selected.push(window.febChkBxvalue);
                }
                if (window.marChkBx != 0) {
                    window.marChkBxvalue = 3;
                    selected.push(window.marChkBxname);
                    selected.push(window.marChkBxvalue);
                }
                if (window.aprChkBx != 0) {
                    window.aprChkBxvalue = 4;
                    selected.push(window.aprChkBxname);
                    selected.push(window.aprChkBxvalue);
                }
                if (window.mayChkBx != 0) {
                    window.mayChkBxvalue = 5;
                    selected.push(window.mayChkBxname);
                    selected.push(window.mayChkBxvalue);
                }
                if (window.junChkBx != 0) {
                    window.junChkBxvalue = 6;
                    selected.push(window.junChkBxname);
                    selected.push(window.junChkBxvalue);
                }
                if (window.julChkBx != 0) {
                    window.julChkBxvalue = 7;
                    selected.push(window.julChkBxname);
                    selected.push(window.julChkBxvalue);
                }
                if (window.augChkBx != 0) {
                    window.augChkBxvalue = 8;
                    selected.push(window.augChkBxname);
                    selected.push(window.augChkBxvalue);
                }
                if (window.sepChkBx != 0) {
                    window.sepChkBxvalue = 9;
                    selected.push(window.sepChkBxname);
                    selected.push(window.sepChkBxvalue);
                }
                if (window.octChkBx != 0) {
                    window.octChkBxvalue = 10;
                    selected.push(window.octChkBxname);
                    selected.push(window.octChkBxvalue);
                }
                if (window.novChkBx != 0) {
                    window.novChkBxvalue = 11;
                    selected.push(window.novChkBxname);
                    selected.push(window.novChkBxvalue);
                }
                if (window.decChkBx != 0) {
                    window.decChkBxvalue = 12;
                    selected.push(window.decChkBxname);
                    selected.push(window.decChkBxvalue);
                }

                if (window.h0ChkBx != 0) {
                    window.h0ChkBxvalue = 0;
                    selected.push(window.h0ChkBxname);
                    selected.push(window.h0ChkBxvalue);
                }
                if (window.h1ChkBx != 0) {
                    window.h1ChkBxvalue = 1;
                    selected.push(window.h1ChkBxname);
                    selected.push(window.h1ChkBxvalue);
                }
                if (window.h2ChkBx != 0) {
                    window.h2ChkBxvalue = 2;
                    selected.push(window.h2ChkBxname);
                    selected.push(window.h2ChkBxvalue);
                }
                if (window.h3ChkBx != 0) {
                    window.h3ChkBxvalue = 3;
                    selected.push(window.h3ChkBxname);
                    selected.push(window.h3ChkBxvalue);
                }
                if (window.h4ChkBx != 0) {
                    window.h4ChkBxvalue = 4;
                    selected.push(window.h4ChkBxname);
                    selected.push(window.h4ChkBxvalue);
                }
                if (window.h5ChkBx != 0) {
                    window.h5ChkBxvalue = 5;
                    selected.push(window.h5ChkBxname);
                    selected.push(window.h5ChkBxvalue);
                }
                if (window.h6ChkBx != 0) {
                    window.h6ChkBxvalue = 6;
                    selected.push(window.h6ChkBxname);
                    selected.push(window.h6ChkBxvalue);
                }
                if (window.h7ChkBx != 0) {
                    window.h7ChkBxvalue = 7;
                    selected.push(window.h7ChkBxname);
                    selected.push(window.h7ChkBxvalue);
                }
                if (window.h8ChkBx != 0) {
                    window.h8ChkBxvalue = 8;
                    selected.push(window.h8ChkBxname);
                    selected.push(window.h8ChkBxvalue);
                }
                if (window.h9ChkBx != 0) {
                    window.h9ChkBxvalue = 9;
                    selected.push(window.h9ChkBxname);
                    selected.push(window.h9ChkBxvalue);
                }
                if (window.h10ChkBx != 0) {
                    window.h10ChkBxvalue = 10;
                    selected.push(window.h10ChkBxname);
                    selected.push(window.h10ChkBxvalue);
                }
                if (window.h11ChkBx != 0) {
                    window.h11ChkBxvalue = 11;
                    selected.push(window.h11ChkBxname);
                    selected.push(window.h11ChkBxvalue);
                }
                if (window.h12ChkBx != 0) {
                    window.h12ChkBxvalue = 12;
                    selected.push(window.h12ChkBxname);
                    selected.push(window.h12ChkBxvalue);
                }
                if (window.h13ChkBx != 0) {
                    window.h13ChkBxvalue = 13;
                    selected.push(window.h13ChkBxname);
                    selected.push(window.h13ChkBxvalue);
                }
                if (window.h14ChkBx != 0) {
                    window.h14ChkBxvalue = 14;
                    selected.push(window.h14ChkBxname);
                    selected.push(window.h14ChkBxvalue);
                }
                if (window.h15ChkBx != 0) {
                    window.h15ChkBxvalue = 15;
                    selected.push(window.h15ChkBxname);
                    selected.push(window.h15ChkBxvalue);
                }
                if (window.h16ChkBx != 0) {
                    window.h16ChkBxvalue = 16;
                    selected.push(window.h16ChkBxname);
                    selected.push(window.h16ChkBxvalue);
                }
                if (window.h17ChkBx != 0) {
                    window.h17ChkBxvalue = 17;
                    selected.push(window.h17ChkBxname);
                    selected.push(window.h17ChkBxvalue);
                }
                if (window.h18ChkBx != 0) {
                    window.h18ChkBxvalue = 18;
                    selected.push(window.h18ChkBxname);
                    selected.push(window.h18ChkBxvalue);
                }
                if (window.h19ChkBx != 0) {
                    window.h19ChkBxvalue = 19;
                    selected.push(window.h19ChkBxname);
                    selected.push(window.h19ChkBxvalue);
                }
                if (window.h20ChkBx != 0) {
                    window.h20ChkBxvalue = 20;
                    selected.push(window.h20ChkBxname);
                    selected.push(window.h20ChkBxvalue);
                }
                if (window.h21ChkBx != 0) {
                    window.h21ChkBxvalue = 21;
                    selected.push(window.h21ChkBxname);
                    selected.push(window.h21ChkBxvalue);
                }

                if (window.h22ChkBx != 0) {
                    window.h22ChkBxvalue = 22;
                    selected.push(window.h22ChkBxname);
                    selected.push(window.h22ChkBxvalue);
                }
                if (window.h23ChkBx != 0) {
                    window.h23ChkBxvalue = 23;
                    selected.push(window.h23ChkBxname);
                    selected.push(window.h23ChkBxvalue);
                }

                // if (window.int0ChkBx != 0) {
                //     window.int0ChkBxvalue = 0;
                //     selected.push(window.int0ChkBxname);
                //     selected.push(window.int0ChkBxvalue);
                // }
                // if (window.int5ChkBx != 0) {
                //     window.int5ChkBxvalue = 5;
                //     selected.push(window.int5ChkBxname);
                //     selected.push(window.int5ChkBxvalue);
                // }
                // if (window.int15ChkBx != 0) {
                //     window.int15ChkBxvalue = 15;
                //     selected.push(window.int15ChkBxname);
                //     selected.push(window.int15ChkBxvalue);
                // }
                // if (window.hrintChkBx != 0) {
                //     window.hrintChkBxvalue = 60;
                //     selected.push(window.hrintChkBxname);
                //     selected.push(window.hrintChkBxvalue);
                // }
                // if (window.dayintChkBx != 0) {
                //     window.dayintChkBxvalue = 24;
                //     selected.push(window.dayintChkBxname);
                //     selected.push(window.dayintChkBxvalue);
                // }
                
                var counter = 0;
                var overall = 0;
                for (var j in variables) {
                    var param = j;
                    var arrayvalues = variables[j];
                    for (var i = 0; i <= selected.length; i++) {
                        index = i + 1;
                        if (selected[i] == param) {
                            arrayvalues.push(selected[index]);
                        }

                        i++;
                    }
                    if (arrayvalues.length == 0) {

                    } else if (counter == 0) {

                        // fix for random LRSID's being added to the data widget when using speeds...
                        // have to change this construction of the string for years.
                        for (var m = 0; m < arrayvalues.length; m++) {
                            string += param + " = " + arrayvalues[m];
                            if (m !== arrayvalues.length - 1)
                                string += " OR ";
                            if(m == arrayvalues.length-1){
                                string += ")";
                            }
                        }
                        string = "(" + string;
                        counter++;
                        overall++;
                    } else if (counter > 0 && overall > 0) {
                        string += " AND (";
                        for (var m = 0; m < arrayvalues.length; m++) {
                            string += param + " = " + arrayvalues[m];
                            if (m !== arrayvalues.length - 1)
                                string += " OR ";
                            if(m == arrayvalues.length-1){
                                string += ")";
                            }
                        }
                        counter++;
                    }
                    
                    if (counter == selected.length) {
                        counter = 0;
                    }
                }
//                alert("current string" + string);
                //append corresponding LRSID links
                //not actually using this right now but this is the one we will use
				
//                if (window.linkSql !== undefined && window.linkSql !== null && string !== "")
//                    string += " AND " + window.linkSql;
//                else if(window.linkSql !== "undefined" && window.linkSql !== undefined){
//                    string += window.linkSql;
//                }
				///////////////////////////////////////////IMPORTANT/////////////////////////////////////////////////////
				/////////////////////////////////////////////////////////////////////////////////////////////////////////
				//uncomment this when more data is present. 
				//currently commented out to test roads and where strings
				//note this is what's currently in the alert 
				
				
                

                if (this.query.where == "1 = 1 AND ") {
                    this.query.where = "1 = 1";
                };
				
				
                this.query.returnGeometry = false;
				//define statistic definitions 
                
				//this.query.where = "1 = 1";
                //alert("current where" + this.query.where);
			   
                //query data set and outfields
				alert("source is " + window.srcvalue);
				//define logic for the source values 
                if (window.srcvalue == "TMC Device") {
                    //alert(window.srcvalue);
                    this.queryTask = new QueryTask("https://cadsrgis2.org/arcgis/rest/services/trafdata/trafhr1218/MapServer/0");
                    // https://cadsrgis2.org/arcgis/rest/services/trafdata/trafsamp/MapServer/0
                    this.query.outFields = ["LRSIDNUM", "VOLUME","LRSID"];
                    this.query.groupByFieldsForStatistics = ["LRSID"];
					var sqlExpression = "VOLUME";
                } 
                
                else if (window.srcvalue == "Speeds") {
                    console.log(window.srcvalue);
					this.queryTask = new QueryTask("https://cadsrgis2.org/arcgis/rest/services/trafdata/speed17/MapServer/0"); // rest service for spds not in services
					this.query.outFields = ["LRSIDNUM", "SPEED", "LRSID"];
                    this.query.groupByFieldsForStatistics = ["LRSID"];
                    var sqlExpression = "SPEED";
                }
                if (window.srcvalue == "Bluetooth") {
                    console.log(window.srcvalue);
                    this.queryTask = new QueryTask("https://cadsrgis2.org/arcgis/rest/services/trafdata/bluesep18hr/MapServer/0");
                    // https://cadsrgis2.org/arcgis/rest/services/trafdata/trafsamp/MapServer/0
                    this.query.outFields = ["LRSIDNUM", "SPEED","LRSID"];
                    this.query.groupByFieldsForStatistics = ["LRSID"];
					var sqlExpression = "SPEED";
                } 
                if (window.srcvalue == "DE ATR AADT") {
                    console.log(window.srcvalue);
                    this.queryTask = new QueryTask("https://cadsrgis2.org/arcgis/rest/services/trafdata/atrvolume11to16/MapServer/0");
                    // https://cadsrgis2.org/arcgis/rest/services/trafdata/trafsamp/MapServer/0
                    this.query.outFields = ["LRSIDNUM", "VOLUME","LRSID"];
                    this.query.groupByFieldsForStatistics = ["LRSID"];
					var sqlExpression = "VOLUME";
                } 
                if (window.srcvalue == "NPMRDS") {
                    console.log(window.srcvalue);
                    this.queryTask = new QueryTask("https://cadsrgis2.org/arcgis/rest/services/trafdata/nprmrds/MapServer/0");
                    // https://cadsrgis2.org/arcgis/rest/services/trafdata/trafsamp/MapServer/0
                    this.query.outFields = ["LRSIDNUM", "SPEED","LRSID"];
                    this.query.groupByFieldsForStatistics = ["LRSID"];
					var sqlExpression = "SPEED";
                } 
                
//                else if (window.srcvalue == "DE Vehicle GPS") {
//					this.queryTask = new QueryTask("")
//					this.query.outFields = ["LRSID", ""];
//					var sqlExpression = "";
//                }
//                
//                else if (window.srcvalue == "FHA Trav Time") {
//					this.queryTask = new QueryTask("")
//					this.query.outFields = ["LRSID", ""];
//					var sqlExpression = "";
//                }
//                
//                else if (window.srcvalue == "BlueTooth") {
//					this.queryTask = new QueryTask("")
//					this.query.outFields = ["LRSID", ""];
//					var sqlExpression = "";
//                }
//                
//                else if (window.srcvalue == "Intersection Counts") {
//					this.queryTask = new QueryTask("")
//					this.query.outFields = ["LRSID", ""];
//					var sqlExpression = "";
//                }
//                
//                else if (window.srcvalue == "DE ADT AADT") {
//					this.queryTask = new QueryTask("")
//					this.query.outFields = ["LRSID", ""];
//					var sqlExpression = "";
//                }
//                
//                else if (window.srcvalue == "Traffic Studies") {
//					this.queryTask = new QueryTask("")
//					this.query.outFields = ["LRSID", ""];
//					var sqlExpression = "";
//                }
//                
//                else if (window.srcvalue == "TDFM") {
//					this.queryTask = new QueryTask("")
//					this.query.outFields = ["LRSID", ""];
//					var sqlExpression = "";
//                }
//                
//                else if (window.srcvalue == "DE ATR Hourly") {
//					this.queryTask = new QueryTask("")
//					this.query.outFields = ["LRSID", ""];
//					var sqlExpression = "";
//                }
//                
//                else if (window.srcvalue == "TOMP") {
//					this.queryTask = new QueryTask("")
//					this.query.outFields = ["LRSID", ""];
//					var sqlExpression = "";
//                }
//                
//                else if (window.srcvalue == "UD Engineering") {
//					this.queryTask = new QueryTask("")
//					this.query.outFields = ["LRSID", ""];
//					var sqlExpression = "";
//                }
                
                else {
					//stop the process to avoid crash
      //              alert("No source selected. Query Failed.");
                    
					
                }
                //insert else ifs for other data sets here when we get there
				
				var minStatDef = new StatisticDefinition();
                minStatDef.statisticType = "min";
                minStatDef.onStatisticField = sqlExpression;
                minStatDef.outStatisticFieldName = "min" + sqlExpression;
            
                var maxStatDef = new StatisticDefinition();
                maxStatDef.statisticType = "max";
                maxStatDef.onStatisticField = sqlExpression;
                maxStatDef.outStatisticFieldName = "max"+ sqlExpression;
          
                var avgStatDef = new StatisticDefinition();
                avgStatDef.statisticType = "avg" ;
                avgStatDef.onStatisticField = sqlExpression;
                avgStatDef.outStatisticFieldName = "avg"+ sqlExpression;

                var countStatDef = new StatisticDefinition();
                countStatDef.statisticType = "count";
                countStatDef.onStatisticField = sqlExpression;
                countStatDef.outStatisticFieldName = "numRecords";
                
                var stddevStatDef = new StatisticDefinition();
                stddevStatDef.statisticType = "stddev";
                stddevStatDef.onStatisticField = sqlExpression;
                stddevStatDef.outStatisticFieldName = "StdDev" + sqlExpression;

                var sumdevStatDef = new StatisticDefinition();
                sumdevStatDef.statisticType = "sum";
                sumdevStatDef.onStatisticField = sqlExpression;
                sumdevStatDef.outStatisticFieldName = "Sum" + sqlExpression;

                this.query.outStatistics = [avgStatDef, countStatDef,  maxStatDef, minStatDef, stddevStatDef];
                //this.query.groupByFieldsForStatistics = ["LRSID"];
				
                //BY VARIABLE

                // this.query.where = "LRSID in ('0000010102001030S','0000010055000980S')";
                if (window.byvar1DropList != "none" && window.byvar1DropList != "") { //check null
                        console.log("NONE LOL")
                        this.query.groupByFieldsForStatistics.push(window.byvar1DropList);
                        this.query.orderByFieldsForStatistics.push(window.byvar1DropList);
                        //this.query.outFields.push(window.byvar1DropList);
                    }
                if (window.byvar2DropList != "none" && window.byvar1DropList != "") { //check null
                        this.query.groupByFieldsForStatistics.push(window.byvar2DropList);
                    }
                
				this.query.where = string;
                
                
				this.query.where = window.trafficSQL.value + " AND " + this.query.where;
                alert(this.query.where);
                
                
                
                
                if(window.begday!=window.endday){
                this.query.where = this.query.where+" AND (DAY BETWEEN"+window.begday+" AND "+window.endday+")";
                    this.query.outFields.push("DAY");
                }
                if(window.begmonth!=window.endmonth){
                    this.query.where = this.query.where+ "AND "+
                    "(MONTH BETWEEN "+window.begmonth+" AND "+window.endmonth+")";
                    this.query.outFields.push("MONTH");
                }
                if(window.begyear!= window.endyear){
                    this.query.where = this.query.where+"AND "+
                    "(YEAR BETWEEN "+window.begyear+" AND "+window.endyear+")";
                    this.query.outFields.push('DAY', 'MONTH', 'YEAR');
                }
                    
                    
                     
//				alert(this.query.groupByFieldsForStatistics);
//				alert(this.query.outFields);
                this.queryTask.execute(this.query, lang.hitch(this, this.fillGrid));
            },

            fillGrid: function(results, grid) { 
                //make sure grid is clear
                var div = document.getElementById('grid1');
                while (div.firstChild) {
                    div.removeChild(div.firstChild);
                }
                //walk through results of query
                var resultItems = [];
                var resultCount = results.features.length;
                if (results.features.length == 0) {
//                  alert("No records for this query.");
                } else {
//                   alert("Number of selected records is " + results.features.length);
                }
                
                if(window.srcvalue == "TMC Device"){
                    for(var i = 0; i < results.features.length; i++){
                    results.features[i].attributes.StdDevVOLUME = Math.round(results.features[i].attributes.StdDevVOLUME * 10) / 10;
                    results.features[i].attributes.avgVOLUME = Math.round(results.features[i].attributes.avgVOLUME * 10) / 10;
                    results.features[i].attributes.maxVOLUME = Math.round(results.features[i].attributes.maxVOLUME);
                    results.features[i].attributes.minVOLUME = Math.round(results.features[i].attributes.minVOLUME);
                    }
                }
                
                
                if(window.srcvalue == "Speeds"){
                    for(var i = 0; i < results.features.length; i++){
                    results.features[i].attributes.StdDevSPEED = Math.round(results.features[i].attributes.StdDevSPEED * 10) / 10;
                    results.features[i].attributes.avgSPEED = Math.round(results.features[i].attributes.avgSPEED * 10) / 10;
                    results.features[i].attributes.maxSPEED = Math.round(results.features[i].attributes.maxSPEED);
                    results.features[i].attributes.minSPEED = Math.round(results.features[i].attributes.minSPEED);
                    }
                }
                if(window.srcvalue == "Bluetooth"){
                    for(var i = 0; i < results.features.length; i++){
                    results.features[i].attributes.StdDevspeed = Math.round(results.features[i].attributes.StdDevSPEED * 10) / 10;
                    results.features[i].attributes.avgSPEED = Math.round(results.features[i].attributes.avgSPEED * 10) / 10;
                    results.features[i].attributes.maxSPEED = Math.round(results.features[i].attributes.maxSPEED);
                    results.features[i].attributes.minSPEED = Math.round(results.features[i].attributes.minsSPEED);
                    }
                }
                if(window.srcvalue == "DE ATR AADT"){
                    for(var i = 0; i < results.features.length; i++){
                    results.features[i].attributes.StdDevVOLUME = results.features[i].attributes.StdDevvolume|0;
                    results.features[i].attributes.avgVOLUME = Math.round(results.features[i].attributes.avgVOLUME * 10) / 10;
                    results.features[i].attributes.maxVOLUME = Math.round(results.features[i].attributes.maxVOLUME);
                    results.features[i].attributes.minVOLUME = Math.round(results.features[i].attributes.minVOLUME);
                    }
                }
                
                var featureArray = [];
                for (var i = 0; i < results.features.length; i++) {
                    var feature = results.features[i].attributes;
                    featureArray.push(feature);
                }
                var columnsTemplate = [];
                // Generate Dynamic Columns based on Feature Layer data
                for (var i = 0; i < results.fields.length; i++) {
                    var columnObj = { //set column names and aliases (the same values in our case)
                        label: results.fields[i].name,
                        field: results.fields[i].alias
                    };
                    columnsTemplate.push(columnObj);
                }
				
//				alert(results.fields[0]);
				
                //create new grid
                var grid = new OnDemandGrid({
                    selectionMode: "single",
                    bufferRows: Infinity,
                    cellNavigation: false
                }, "grid1");

                grid.setColumns(columnsTemplate);
                var dataStore = new Memory({
                    "data": featureArray,
                    // "idProperty": queryTask.objectIdField
                });
                grid.set("store", dataStore);
//                grid.sort('LRSID', 'Hour');               
                window.rows = [];
                
                if(window.srcvalue == 'TMC Device'){
                var datanames = [];
                datanames.push('LRSID');
                datanames.push('avgVOLUME');
                datanames.push('numRecords');
                datanames.push('maxVOLUME');
                datanames.push('minVOLUME');
                datanames.push("StdDevVOLUME");
                window.rows.push(datanames);
                
                
                
                for(var step = 0; step<grid.store.data.length; step++){
                    var data = [];
                    data.push(grid.store.data[step].LRSID);
                    data.push(grid.store.data[step].avgVOLUME);
                    data.push(grid.store.data[step].numRecords);
                    data.push(grid.store.data[step].maxVOLUME);
                    data.push(grid.store.data[step].minVOLUME);
                    data.push(grid.store.data[step].StdDevVOLUME);
                    window.rows.push(data);
                }
                }
                if(window.srcvalue == 'Bluetooth'){
                var datanames = [];
                datanames.push('LRSID');
                datanames.push('avgSPEED');
                datanames.push('numRecords');
                datanames.push('maxSPEED');
                datanames.push('minSPEED');
                datanames.push("StdDevSPEED");
                window.rows.push(datanames);
                
                
                
                for(var step = 0; step<grid.store.data.length; step++){
                    var data = [];
                    data.push(grid.store.data[step].LRSID);
                    data.push(grid.store.data[step].avgSPEED);
                    data.push(grid.store.data[step].numRecords);
                    data.push(grid.store.data[step].maxSPEED);
                    data.push(grid.store.data[step].minSPEED);
                    data.push(grid.store.data[step].StdDevSPEED);
                    window.rows.push(data);
                }
                }
                
                if(window.srcvalue == 'Speeds'){
                var datanames = [];
                datanames.push('LRSID');
                datanames.push('avgSPEED');
                datanames.push('numRecords');
                datanames.push('maxSPEED');
                datanames.push('minSPEED');
                datanames.push("StdDevSPEED");
                window.rows.push(datanames);
                
                
                
                for(var step = 0; step<grid.store.data.length; step++){
                    var data = [];
                    data.push(grid.store.data[step].LRSID);
                    data.push(grid.store.data[step].avgSPEED);
                  
                    data.push(grid.store.data[step].numRecords);
                    data.push(grid.store.data[step].maxSPEED);
                    data.push(grid.store.data[step].minSPEED);
                    data.push(grid.store.data[step].StdDevSPEED);
                    window.rows.push(data);
                }
                }
                
                
                
                if(window.srcvalue == 'DE ATR AADT'){
                var datanames = [];
                datanames.push('LRSID');
                datanames.push('avgVOLUME');
                datanames.push('numRecords');
                datanames.push('maxVOLUME');
                datanames.push('minVOLUME');
                datanames.push("StdDevVOLUME");
                window.rows.push(datanames);
                
                
                
                for(var step = 0; step<grid.store.data.length; step++){
                    var data = [];
                    data.push(grid.store.data[step].LRSID);
                    data.push(grid.store.data[step].avgVOLUME);
                    data.push(grid.store.data[step].numRecords);
                    data.push(grid.store.data[step].maxVOLUME);
                    data.push(grid.store.data[step].minVOLUME);
                    data.push(grid.store.data[step].StdDevVOLUME);
                    window.rows.push(data);
                }
                }
                if(window.srcvalue == 'NPMRDS'){
                var datanames = [];
                datanames.push('LRSID');
                datanames.push('avgSPEED');
                datanames.push('numRecords');
                datanames.push('maxSPEED');
                datanames.push('minSPEED');
                datanames.push("StdDevSPEED");
                window.rows.push(datanames);
                
                
                
                for(var step = 0; step<grid.store.data.length; step++){
                    var data = [];
                    data.push(grid.store.data[step].LRSID);
                    data.push(grid.store.data[step].avgSPEED);
                    data.push(grid.store.data[step].numRecords);
                    data.push(grid.store.data[step].maxSPEED);
                    data.push(grid.store.data[step].minSPEED);
                    data.push(grid.store.data[step].StdDevSPEED);
                    window.rows.push(data);
                }
                }
                
                
                
                
                
                
                
            },
            
            exportToCsv:   function(filename, rows) {
                var processRow = function (row) {
                    var finalVal = '';
                    for (var j = 0; j < row.length; j++) {
                        console.log(row[j], innerValue);
                        var innerValue = row[j] === null ? '' : row[j].toString();
                        if (row[j] instanceof Date) {
                            innerValue = row[j].toLocaleString();
                        };
                        var result = innerValue.replace(/"/g, '""');
                        if (result.search(/("|,|\n)/g) >= 0)
                            result = '"' + result + '"';
                        if (j > 0)
                            finalVal += ',';
                        finalVal += result;
                    }
                    return finalVal + '\n';
                };
                
                var csvFile = '';
                for (var i = 0; i < rows.length; i++) {
                    csvFile += processRow(rows[i]);
                }

                var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
                if (navigator.msSaveBlob) { // IE 10+
                    navigator.msSaveBlob(blob, filename);
                } else {
                    var link = document.createElement("a");
                    if (link.download !== undefined) { // feature detection
                        // Browsers that support HTML5 download attribute
                        var url = URL.createObjectURL(blob);
                        link.setAttribute("href", url);
                        link.setAttribute("download", filename);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                }
            }
    
    
    
//exportToCsv('export.csv', [
//	['name','description'],	
//  ['david','123'],
//  ['jona','""'],
//  ['a','b'],
//
//])
            


        });
    });