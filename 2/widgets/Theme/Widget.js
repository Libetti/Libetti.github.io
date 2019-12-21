define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/html",
  "dojo/_base/array",
  "dojo/on",
  "dojo/promise/all",
  "dojo/Deferred",
  "dijit/_WidgetsInTemplateMixin",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/jsonUtils",
  "esri/Color",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "jimu/BaseWidget",
  "jimu/WidgetManager",
  "jimu/dijit/ViewStack",
  "jimu/dijit/FeatureSetChooserForMultipleLayers",
  "jimu/LayerInfos/LayerInfos",
  "esri/layers/FeatureLayer",
  "jimu/SelectionManager",
  "jimu/PanelManager",
  "./layerUtil",
  "./SelectableLayerItem",
  "./FeatureItem",
  "jimu/dijit/LoadingShelter",
  "esri/request",
  "esri/graphicsUtils",
  "esri/geometry/webMercatorUtils",
  "esri/graphic",
  "esri/geometry/Polyline",
  "esri/tasks/StatisticDefinition",
  "esri/tasks/FeatureSet",
  "esri/layers/GraphicsLayer",
  "esri/graphic",
  "esri/geometry/Point",
  "dojo/_base/Color",
  "esri/geometry/jsonUtils",
  "esri/symbols/jsonUtils",
  "dijit/layout/TabContainer",
  "dijit/layout/ContentPane",
  "dijit/form/DateTextBox",
  "esri/renderers/ClassBreaksRenderer",
  "esri/symbols/Font",
  "dijit/registry",
  "dojo/Stateful",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/dijit/TimeSlider",
  "esri/TimeExtent",
  "dijit/Destroyable",
  "dijit/TitlePane",
  "esri/layers/ImageParameters"
], function(
  declare,
  lang,
  html,
  array,
  on,
  all,
  Deferred,
  _WidgetsInTemplateMixin,
  SimpleMarkerSymbol,
  SimpleLineSymbol,
  SimpleFillSymbol,
  SymbolJsonUtils,
  Color,
  Query,
  QueryTask,
  BaseWidget,
  WidgetManager,
  ViewStack,
  FeatureSetChooserForMultipleLayers,
  LayerInfos,
  FeatureLayer,
  SelectionManager,
  PanelManager,
  layerUtil,
  SelectableLayerItem,
  FeatureItem,
  LoadingShelter,
  esriRequest,
  graphicsUtils,
  webMercatorUtils,
  Graphic,
  Polyline,
  StatisticDefinition,
  FeatureSet,
  GraphicsLayer,
  Graphic,
  Point,
  Color,
  jsonUtils,
  SymbolJsonUtils,
  TabContainer,
  ContentPane,
  DateTextBox,
  ClassBreaksRenderer,
  Font,
  registry,
  Stateful,
  ArcGISDynamicMapServiceLayer,
  TimeSlider,
  TimeExtent,
  Destroyable,
  TitlePane,
  ImageParameters
) {
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    baseClass: "jimu-widget-theme",
    theobjetid: 0,
    // clasName: 'esri.widgets.About',

    postMixInProperties: function() {
      this.inherited(arguments);
      lang.mixin(this.nls, window.jimuNls.common);
    },

    postCreate: function() {
      this.inherited(arguments);
      var rgbcolorarr = [
        "rgb(255,255,204)",
        "rgb(255,237,160)",
        "rgb(254,217,118)",
        "rgb(254,178,76)",
        "rgb(253,141,60)",
        "rgb(252,78,42)",
        "rgb(227,26,28)",
        "rgb(189,0,38)",
        "rgb(128,0,38)",
        "rgb(80,0,38)"
      ];
      var classvalarraydefaults = [
        0,
        50,
        100,
        200,
        350,
        500,
        700,
        800,
        1000,
        1200
      ];
      var speedarraydefaults = [0, 10, 15, 25, 35, 40, 45, 50, 60, 70];

      var wm = WidgetManager.getInstance();
      window.selectedlrs = "(";
      window.linkSql = "";
      window.selected = [];
      window.selectndx = 0;
      window.linkarray = [];
      window.linkarrayndx = -1;
      window.temparray = [];
      window.temparrayndx = 0;
      window.newindex = 0;
      window.newselect = [];
      window.selectnum = 0;
      window.timeFlag = false;
      window.layerCount = 0;
      const srcDescriptions = {
        bluesep17typeffspd:
          "Bluetooth, Typical Week Averages for Travel Speeds",
        fleet1719freeflow: " State Vehicle GPS, Free Flow 2017 - 2019",
        fleet1719TYPNdegrade:
          "State Vehicle GPS, Typical Week % Degradation from Free Flow, Excludes Summer",
        fleet1719TYPNeffspd:
          "State Vehicle GPS, Typical Week Average Travel Speeds, Excludes Summer",
        npmrds17TYPNeffspd:
          "NPMRDS, Typical Week Averages for Travel Speeds, Excludes Summer",
        npmrds17TYPNspddeg:
          "NPMRDS, Typical Week % Speed Degradation from Free Flow,  Excludes Summer",
        npmrds17TYPNtimedeg:
          "NPMRDS, Typcical Week % Time degradation Excludes Summer",
        tmc1217typndow: "TMC Devices, Typical Volumes, Excludes Summer",
        tmc1217typsumdow: "TMC Devices, Typical Volumes, Includes Summer"
      };

      this.inherited(arguments);
      var selectionColor = new Color("#00FFFF");
      this.defaultPointSymbol = new SimpleMarkerSymbol(
        SimpleMarkerSymbol.STYLE_CIRCLE,
        16,
        null,
        selectionColor
      );

      this.defaultLineSymbol = new SimpleLineSymbol(
        SimpleLineSymbol.STYLE_SOLID,
        selectionColor,
        2
      );

      this.defaultFillSymbol = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        this.defaultLineSymbol,
        new Color([selectionColor.r, selectionColor.g, selectionColor.b, 0.3])
      );

      this.layerMapper = {};
      this.layerInfoArray = [];
      this.layerItems = [];

      // Status bar init && Snakckbar
      this.s = document.getElementById("snackbar");

      //initiate defaults
      this.updateWindowVars();

      this.filtqueryTask = new QueryTask(
        "https://cadsrgis2.org/arcgis/rest/services/trafdata/filters/FeatureServer/0"
      );
      this.filtquery = new Query();
      this.filtquery.returnGeometry = false;
      this.filtquery.where = "1=1";
      this.filtquery.outFields = ["*"];

      //listener events used for modifying variables
      //listener that loads filters based on the username
      on(
        this.TheUserf,
        "change",
        lang.hitch(this, function() {
          window.TheUser = this.TheUserf.value;
          this.filtquery.where = "USERNAME = '" + this.TheUserf.value + "'";
          //call loadfilter helper
          this.filtqueryTask.execute(
            this.filtquery,
            lang.hitch(this, this.loadFilters)
          );
          //this variable helps login to other apps (see postcreate) if one is already open
          window.open = true;
          this.s.innerHTML =
            "Status: User " + this.TheUserf.value + " was loaded";
        })
      );
      //saves users source value (srcvalue)
      on(
        this.sourceDropList,
        "change",
        lang.hitch(this, function() {
          window.srcvalue = this.sourceDropList.value;
        })
      );
      //when a filter is selected from a droplist, constructs a query based on the username and value
      on(
        this.filterDropListf,
        "change",
        lang.hitch(this, function() {
          var curfil = dojo.byId("CurrentFilterf");
          var drop = dojo.byId("filterDropListf");
          if (drop.selectedIndex != 0) {
            curfil.value = drop.options[drop.selectedIndex].text;
            window.currentfilter = curfil.value;
            this.filtquery.where =
              "USERNAME = '" +
              this.TheUserf.value +
              "' AND SELNAME = '" +
              window.currentfilter +
              "'";
            this.filtqueryTask.execute(
              this.filtquery,
              lang.hitch(this, this.loadFilterDataf)
            );
            this.s.innerHTML =
              "Status: " + this.filterDropListf.value + " filter loaded";
          }
        })
      );
      //maybe add change events for all of the drop lists
      on(
        this.delFilter,
        "click",
        lang.hitch(this, function() {
          this.filtquery.where =
            "USERNAME = '" +
            this.TheUserf.value +
            "'" +
            "AND SELNAME = '" +
            this.CurrentFilterf.value +
            "'";
          this.filtqueryTask.execute(
            this.filtquery,
            lang.hitch(this, this.deleteFilter)
          );
        })
      );

      // End of Filter postcreate
      // Begin Select postcreate
      on(
        this.saveselBut,
        "click",
        lang.hitch(this, function() {
          this.saveRT;
        })
      );
      on(
        this.csv,
        "click",
        lang.hitch(this, function() {
          var input = prompt(
            "Enter a name for your file ('data.csv')",
            "data.csv"
          );
          this.exportToCsv(input, window.rows);
        })
      );

      on(
        this.deleteselBut,
        "click",
        lang.hitch(this, function() {
          this.routequery.where =
            "username = '" +
            this.TheUser.value +
            "'" +
            "AND rtname = '" +
            window.currentroute +
            "'";
          this.routequery.outFields = ["rttext", "rtname", "OBJECTID"];
          this.routequeryTask.execute(
            this.routequery,
            lang.hitch(this, this.deleteSelRoute)
          );
        })
      );

      on(
        this.clearSQL,
        "click",
        lang.hitch(this, function() {
          //this.map.removeLayer(this.map.getLayer("data layer"));
          //this.map.graphics.removeAll();
          this.map.removeLayer("data layer");
        })
      );

      on(
        this.datadump,
        "click",
        lang.hitch(this, function() {
          var dataq = new Query();
          dataq.outFields = ["*"];
          dataq.where = window.filtwhere;
          if (!window.filtwhere) {
            this.notifier("No records were found");
            return;
          }
          this.queryTask.execute(dataq, lang.hitch(this, this.dataD));
        })
      );

      on(
        this.reloadLayer,
        "click",
        lang.hitch(this, function() {
          //element1 = document.getElementById("staticFilterList");
          element2 = document.getElementById("filterDropList");
          var event = new Event("change");
          //element1.dispatchEvent(event);
          element2.dispatchEvent(event);
        })
      );

      this.selectDijit = new FeatureSetChooserForMultipleLayers(
        {
          map: this.map,
          updateSelection: true,
          fullyWithin: this.config.selectionMode === "wholly"
        },
        this.layerListNode
      );
      var stab = dijit.byId("selectTab");
      console.log(this.selectDijit.domNode);
      console.log(this.selectDijitNode);
      html.place(this.selectDijit.domNode, this.selectW);
      this.selectDijit.startup();

      this.own(
        on(
          this.selectDijit,
          "user-clear",
          lang.hitch(this, this._clearAllSelections)
        )
      );
      this.own(
        on(this.selectDijit, "loading", lang.hitch(this, function() {}))
      );
      this.own(
        on(
          this.selectDijit,
          "unloading",
          lang.hitch(this, function() {
            this.getSQL(this.layerItems);
          })
        )
      );

      this.viewStack = new ViewStack({
        viewType: "last",
        views: [this.layerListNode, this.detailsNode]
      });
      console.log(this.viewStack.domNode);
      console.log(this.domNode);
      html.place(this.viewStack.domNode, this.domNode);

      this.own(
        on(
          this.switchBackBtn,
          "click",
          lang.hitch(this, this._switchToLayerList)
        )
      );

      this._switchToLayerList();

      var layerInfosObject = LayerInfos.getInstanceSync();

      layerUtil.getLayerInfoArray(layerInfosObject).then(
        lang.hitch(this, function(layerInfoArray) {
          //First loaded, reset selectableLayerIds
          this._initLayers(layerInfoArray);
        })
      );

      this.own(
        on(
          layerInfosObject,
          "layerInfosChanged",
          lang.hitch(this, function() {
            layerUtil.getLayerInfoArray(layerInfosObject).then(
              lang.hitch(this, function(layerInfoArray) {
                this._initLayers(layerInfoArray);
              })
            );
          })
        )
      );

      this.own(
        on(
          layerInfosObject,
          "layerInfosIsShowInMapChanged",
          lang.hitch(this, this._layerVisibilityChanged)
        )
      );

      this.own(
        on(this.map, "zoom-end", lang.hitch(this, this._layerVisibilityChanged))
      );

      /////////////////////////////////////////////////////////////////////////////////////////////////////////
      //Build query objects for the filter and the route
      /////////////////////////////////////////////////////////////////////////////////////////////////////////

      this.filtqueryTask = new QueryTask(
        "https://cadsrgis2.org/arcgis/rest/services/trafdata/filters/FeatureServer/0"
      );
      this.filtquery = new Query();
      this.filtquery.returnGeometry = false;
      this.filtquery.where = "1=1";
      this.filtquery.outFields = ["*"];

      this.routequeryTask = new QueryTask(
        "https://cadsrgis2.org/arcgis/rest/services/trafdata/trafroutes/FeatureServer/0"
      );
      this.routequery = new Query();
      this.routequery.returnGeometry = true;
      this.routequery.where = "1=1";
      this.routequery.outFields = ["*"];

      this.colorqueryTask = new QueryTask(
        "https://cadsrgis2.org/arcgis/rest/services/trafdata/linkgeo/MapServer/0"
      );
      this.colorQuery = new Query();

      this.colorQuery.where = "";

      this.colorQuery.returnGeometry = true;
      this.colorQuery.outFields = ["*"];

      on(
        this.TheUser,
        "change",
        lang.hitch(this, function() {
          window.TheUser = this.TheUser.value;
          this.filtquery.where = "USERNAME = '" + this.TheUser.value + "'";
          this.filtqueryTask.execute(
            this.filtquery,
            lang.hitch(this, this.loadSelectFilters)
          );
          this.routequery.where = "username = '" + this.TheUser.value + "'";
          this.routequeryTask.execute(
            this.routequery,
            lang.hitch(this, this.loadRoutes)
          );
          window.open = true;
          this.s.innerHTML =
            "Status: User " + this.TheUser.value + " was loaded";
        })
      );

      on(
        this.filterDropList,
        "change",
        lang.hitch(this, function() {
          var curfil = dojo.byId("CurrentFilter");
          var drop = dojo.byId("filterDropList");
          if (drop.selectedIndex != 0) {
            curfil.value = drop.options[drop.selectedIndex].text;
            window.currentfilter = curfil.value;
            this.filtquery.where =
              "USERNAME = '" +
              this.TheUser.value +
              "' AND SELNAME = '" +
              window.currentfilter +
              "'";
            this.filtqueryTask.execute(
              this.filtquery,
              lang.hitch(this, this.loadFilterData)
            );
            window.open = true;
          }
        })
      );

      on(
        this.classNum,
        "change",
        lang.hitch(this, function() {
          //most of the stuff below is for generatic dynamic html based on how many classes the user wants
          var myNode = document.getElementById("fooBar");
          while (myNode.firstChild) {
            myNode.removeChild(myNode.firstChild);
          }
          if (this.classNum.value > 10) {
            this.notifier(" Maximum number of classes reached - 10");
            this.classNum.value = 10;
          }
          var count = 1;
          window.elarr = [];
          for (var i = 0; i < this.classNum.value; i++) {
            element = document.createElement("input");
            label = document.createElement("Label");
            label.setAttribute("id", "Label");
            label.setAttribute("class", "labelclass");
            linebreak = document.createElement("br");
            label.innerHTML = "Class " + count + ":";
            element.setAttribute("type", "text");
            element.setAttribute("data-dojo-attach-point", "class" + count);
            label.style.color = rgbcolorarr[i];
            element.setAttribute("id", "class" + count);
            window.elarr.push("class" + count);
            console.log(window.srcvalue);
            if (window.srcvalue == ("TMC Device" || "DE ATR AADT")) {
              element.setAttribute("value", classvalarraydefaults[i]);
            } else {
              element.setAttribute("value", speedarraydefaults[i]);
            }
            element.onchange = function() {
              document.getElementById(this.id).value = this.value;
            };
            element.setAttribute("name", "class" + count);
            element.setAttribute("style", "width:50px");
            element.innerHTML = "<br>";
            label.setAttribute("style", "font-weight:bold");
            var foo = document.getElementById("fooBar");
            foo.appendChild(window.label);
            foo.appendChild(window.element);
            element.appendChild(linebreak);
            foo.appendChild(linebreak);
            count++;
          }

          window.open = true;
        })
      );

      on(
        this.routeDropList,
        "change",
        lang.hitch(this, function() {
          var curfill = dojo.byId("routeName");
          var drop = dojo.byId("routeDropList");

          curfill.value = drop.options[drop.selectedIndex].text;
          window.currentroute = curfill.value;
          var routeTask = new QueryTask(
            "https://cadsrgis2.org/arcgis/rest/services/trafdata/trafroutes/FeatureServer/0"
          );
          this.routequery.where =
            "(username = '" +
            this.TheUser.value +
            "') AND (rtname = '" +
            window.currentroute +
            "')";
          //this is bad practice. Bind parameters to prevent injection
          this.routequery.outFields = ["rttext", "rtname"];
          routeTask.execute(
            this.routequery,
            lang.hitch(this, this.loadRouteData)
          );
        })
      );

      // on(
      //   this.quantiles,
      //   "change",
      //   lang.hitch(this, function() {
      //     if (this.quantiles.checked == true) {
      //       window.quantiles.checked = this.quantiles.checked = true;
      //     } else {
      //       window.quantiles.checked = this.quantiles.checked = false;
      //     }
      //   })
      // );

      //TimeSlider init
      on(
        this.staticFilterList,
        "change",
        lang.hitch(this, function() {
          var url = "";
          let outfields = [];
          let displayfields = [];
          let layerDefs = [];
          let dow = null;
          let hour = null;

          var descr = dojo.byId("description").value;
          switch (this.staticFilterList.value) {
            case "efspeed":
              url =
                "https://cadsrgis.org/arcgis/rest/services/traf/effectivespeed/MapServer";
              outfields[0] = ["cadsrdb_DBO_linkgeo_FFSPEED"];
              dow = "cadsrdb_DBO_fleetweeknot_DAY";
              hour = "cadsrdb_DBO_fleetweeknot_HOUR";
              break;
            case "fltgrade":
              url =
                "https://cadsrgis.org/arcgis/rest/services/traf/fleetdegrade/MapServer";
              outfields[0] = ["cadsrdb_DBO_linkgeo_CAPACITY"];
              dow = "cadsrdb_DBO_fltsegnotsum_DAY";
              hour = "cadsrdb_DBO_fltsegnotsum_HOUR";
              break;
            case "blueTime":
              url =
                "https://cadsrgis.org/arcgis/rest/services/trafdata/bluesep17typeffspd/MapServer";
              dojo.byId("description").value =
                srcDescriptions.bluesep17typeffspd;
              outfields[0] = ["speedeff"];
              dow = "DAY";
              hour = "HOUR";
              break;
            case "fleetFreeFlow":
              url =
                "https://cadsrgis.org/arcgis/rest/services/trafdata/fleet1719freeflow/MapServer";
              dojo.byId("description").value =
                srcDescriptions.fleet1719freeflow;
              outfields[0] = ["FFSPEED"];
              layerDefs = null;
              break;
            case "fleetTYPDegrade":
              url =
                "https://cadsrgis.org/arcgis/rest/services/trafdata/fleet1719TYPNdegrade/MapServer";
              dojo.byId("description").value =
                srcDescriptions.fleet1719TYPNdegrade;
              outfields[0] = ["cadsrdb_DBO_linkgeo_CAPACITY"];
              dow = "cadsrdb_DBO_fltsegnotsum_DAY";
              hour = "cadsrdb_DBO_fltsegnotsum_HOUR";
              break;
            case "fleetefSpeed":
              url =
                "https://cadsrgis.org/arcgis/rest/services/trafdata/fleet1719TYPNeffspd/MapServer";
              dojo.byId("description").value =
                srcDescriptions.fleet1719TYPNeffspd;
              outfields[0] = ["cadsrdb_DBO_fleetweeknot_SPEED_"];
              dow = "cadsrdb_DBO_fleetweeknot_DAY";
              hour = "cadsrdb_DBO_fleetweeknot_HOUR";
              break;
            case "spddeg":
              url =
                "https://cadsrgis.org/arcgis/rest/services/trafdata/npmrds17TYPNspddeg/MapServer/";
              dojo.byId("description").value =
                srcDescriptions.npmrds17TYPNspddeg;
              outfields[0] = ["np17notweekday_SPDDEG3RD"];
              dow = "np17notweekday_DAY";
              hour = "np17notweekday_HOUR ";
              break;
            case "timedeg":
              url =
                "https://cadsrgis.org/arcgis/rest/services/trafdata/npmrds17TYPNtimedeg/MapServer/";
              dojo.byId("description").value =
                srcDescriptions.npmrds17TYPNtimedeg;
              outfields[0] = ["np17notweekday_TIMDEG3RD"];
              dow = "np17notweekday_DAY";
              hour = "np17notweekday_HOUR";
              break;
            case "typsum":
              url =
                "https://cadsrgis.org/arcgis/rest/services/trafdata/tmc1217typsumdow/MapServer/";
              dojo.byId("description").value = srcDescriptions.tmc1217typsumdow;
              outfields[0] = ["tmc1218typsum_VOLUME_MEA"];
              dow = "tmc1218typsum_DAY";
              hour = "tmc1218typsum_HOUR";
              break;
            case "typndow":
              url =
                "https://cadsrgis.org/arcgis/rest/services/trafdata/tmc1217typndow/MapServer/";
              dojo.byId("description").value = srcDescriptions.tmc1217typndow;
              outfields[0] = ["tmc1218typndow_VOLUME_MEA"];
              dow = "tmc1218typndow_DAY";
              hour = "tmc1218typndow_HOUR";
              break;
          }
          //layerdef = `"${dow}"=${dojo.byId("staticDay").value}`;
          //layerDefs[0] = layerdef;
          console.log(layerDefs);
          var layer = new esri.layers.ArcGISDynamicMapServiceLayer(url, {
            mode: esri.layers.FeatureLayer.MODE_ONDEMAND,
            id: "ltest"
            //outFields: outfields,
            //displayField: displayfields
          });
          //if (layerDefs) layer.setLayerDefinitions(layerDefs);
          if (window.layerCount) {
            if (this.map.getLayer("data layer"))
              this.map.removeLayer(this.map.getLayer("data layer"));
            if (this.map.getLayer("ltest"))
              this.map.removeLayer(this.map.getLayer("ltest"));
            this.map.graphics.clear();
            this.map.addLayer(layer);
          } else {
            this.map.addLayer(layer);
            console.log(dojo.byId("srcDescription"));
          }
          window.layerCount++;
          var timeExtent = new TimeExtent(
            new Date(`2017-09-${dojo.byId("staticDay").value}T${dojo.byId("staticHour").value.padStart(2,'0')}:00:00`),
            new Date(`2017-09-${dojo.byId("staticDay").value}T${dojo.byId("staticHour").value.padStart(2,'0')}:00:00`)
          );
          if(timeExtent.startTime == "Invalid Date" || timeExtent.endTime == "Invalid Date"){
            this.notifier("Invalid date format")
          }
          console.log(timeExtent);
          this.map.setTimeExtent(timeExtent);
          //not updating slider tick marks
          // if (!window.timeFlag) {
          //   window.timeSlider = new TimeSlider(
          //     { style: "width: 100%;" },
          //     document.getElementById("timeSliderDiv")
          //   );
          //   window.timeFlag = true;
          // }
          // var l = this.map.getLayer("ltest");
          // console.log(this.map);
          // var _this = this;
          // setTimeout(function() {
          //   _this.map.setTimeSlider(window.timeSlider);
          //   window.timeSlider.setThumbCount(1);
          //   window.timeSlider.createTimeStopsByTimeInterval(
          //     l.timeInfo.timeExtent,
          //     10,
          //     "esriTimeUnitsHours"
          //   );
          //   var labels = array.map(window.timeSlider.timeStops, function(
          //     timeStops,
          //     i
          //   ) {
          //     if (i % 2 == 0) {
          //       console.log(timeStops);
          //       tmp = timeStops.getUTCHours();
          //       return tmp;
          //     } else {
          //       return "";
          //     }
          //   });
          //   window.timeSlider.setLabels(labels);
          //   window.timeSlider.startup();
          //   var laby = document.getElementsByClassName("dijitRuleLabelH");
          //   console.log(laby);
          //   console.log(laby.item(1));
          //   laby.item(2).onmouseover = function() {
          //     console.log("here i am");
          //   };
          //   // laby.addEventListener("mouseenter", function(event) {
          //   //   console.log("here i am");
          //   // });
          // }, 500);
        })
      );
    },

    startup: function() {
      // list of input elements in the widget
      var tabs = dijit.byId("tabContainer");
      this.s.innerHTML = "Status: Create a filter loaded";
      var user = this.TheUserf;
      tabs.watch("selectedChildWidget", function(name, oval, nval) {
        if (nval.id == "selectTab") {
          if (typeof user != undefined && user.value != "") {
            element = document.getElementById("TheUser");
            element.value = window.TheUser;
            var event = new Event("change");
            element.dispatchEvent(event);
          }
        }
        nval.id == "filtTab"
          ? (document.getElementById("snackbar").innerHTML =
              "Status: Create a filter loaded")
          : (document.getElementById("snackbar").innerHTML =
              "Status: Select a filter loaded");
      });
      // DateTextBox Init
      // window.filterBeginDate = new Date(dojo.byId("begindatepicker").selected);
      // window.filterEndDate = new Date(dojo.byId("enddatepicker"));
      // console.log(window.filterBeginDate);
      // console.log(window.filterEndDate);

      var inputs = document.getElementsByTagName("input");
      if (typeof window.currentroute === "undefined") {
        window.currentroute == "none";
      }
      //this means a filter was selected in route prior to opening this app.
      //update the values for the checkboxes
      if (window.open == true) {
        this.filtqueryTask = new QueryTask(
          "https://cadsrgis2.org/arcgis/rest/services/trafdata/filters/FeatureServer/0"
        );
        this.filtquery = new Query();
        this.filtquery.returnGeometry = false;
        this.filtquery.where = "1=1";
        this.filtquery.outFields = ["*"];
        window.filteruser = this.TheUserf.value;
        this.filtquery.where = "USERNAME = '" + this.TheUserf.value + "'";
        this.filtqueryTask.execute(
          this.filtquery,
          lang.hitch(this, this.loadFilters)
        );

        // initializes checkbox's checked boolean through the checkboxes status
        for (var i = 0; i < inputs.length; i++) {
          if (!(typeof inputs[i] === "undefined")) {
            if (inputs[i].type == "checkbox") {
              this.inputs[i].checked = window.inputs[i];
            }
          }
        }

        //sets droplist values to the global var values
        this.aggtypeDropList.value = window.aggtypeDropList;
        this.byvar1DropList.value = window.byvar1DropList;
        this.byvar2DropList.value = window.byvar2DropList;
        this.descripTextf.value = window.descripText;
        //add src
        this.sourceDropList.value = window.srcvalue;

        // Select startup
        window.currentfilter = "none";
        window.routeuser = "none";
        window.currentroute = "none";
        window.aarray = [3333, 444];
        this.routequeryTask = new QueryTask(
          "https://cadsrgis2.org/arcgis/rest/services/trafdata/trafroutes/FeatureServer/0"
        );
        this.routequery = new Query();
        this.routequery.returnGeometry = false;
        this.routequery.outFields = ["*"];
        this.routequery.where = "username = '" + this.TheUser.value + "'";
        this.routequeryTask.execute(
          this.routequery,
          lang.hitch(this, this.loadRoutes)
        );
      } else {
        window.open = false;
        window.TheUser = "none";
      }

      this.inherited(arguments);
    },

    onOpen: function() {
      var panel = this.getPanel();
      var pos = panel.position;
      pos.width = 350;
      pos.height = 600;
      panel.setPosition(pos);
      panel.panelManager.normalizePanel(panel);
      this.s.innerHTML = "Status: Filter and Query widget opened";
    },

    onClose: function() {
      this.s.innerHTML = "Status: ";
    },

    onDeActive: function() {
      this.selectDijit.deactivate();
      this._restoreSelectionSymbol();
    },

    onActive: function() {
      this._setSelectionSymbol();
    },

    onDestroy: function() {
      this._clearAllSelections();
    },

    notifier: function(str) {
      const wrapper = document.getElementById("wrapper");
      const notification = document.getElementById("notification");
      const txt = document.querySelector("#notification div");
      notification.className = "show";
      txt.innerHTML = "\t" + str;
      wrapper.style.left =
        (
          wrapper.parentElement.parentElement.clientWidth -
          notification.clientWidth -
          15
        ).toString() + "px";
      setTimeout(function() {
        notification.className = notification.className.replace("show", "");
      }, 3000);
    },

    _initLayers: function(layerInfoArray) {
      this.layerInfoArray = layerInfoArray;
      this.layerItems = [];
      this.selectionSymbols = {};

      html.empty(this.layerItemsNode);

      array.forEach(
        layerInfoArray,
        lang.hitch(this, function(layerInfo) {
          var visible = layerInfo.isShowInMap() && layerInfo.isInScale();

          var item = new SelectableLayerItem({
            layerInfo: layerInfo,
            checked: true,
            layerVisible: visible,
            folderUrl: this.folderUrl,
            allowExport: this.config ? this.config.allowExport : false,
            map: this.map,
            nls: this.nls
          });

          this.own(
            on(item, "switchToDetails", lang.hitch(this, this._switchToDetails))
          );
          this.own(
            on(
              item,
              "stateChange",
              lang.hitch(this, function() {
                this._getSelectableLayers().then(
                  lang.hitch(this, function(layerObjects) {
                    this.selectDijit.setFeatureLayers(layerObjects);
                  })
                );
              })
            )
          );
          html.place(item.domNode, this.detailsW);
          item.startup();

          this.layerItems.push(item);
        })
      );

      this._getSelectableLayers().then(
        lang.hitch(this, function(layerObjects) {
          this.selectDijit.setFeatureLayers(layerObjects);
        })
      );

      this._getLayerObjects().then(
        lang.hitch(this, function(layerObjects) {
          array.forEach(
            layerObjects,
            function(layerObject) {
              if (!layerObject.getSelectionSymbol()) {
                this._setDefaultSymbol(layerObject);
              }

              var symbol = layerObject.getSelectionSymbol();
              //this.selectionSymbols[layerObject.id] = symbol.toJson();
            },
            this
          );

          this._setSelectionSymbol();
        })
      );
    },

    _setSelectionSymbol: function() {
      this._getLayerObjects().then(
        lang.hitch(this, function(layerObjects) {
          array.forEach(
            layerObjects,
            function(layerObject) {
              this._setDefaultSymbol(layerObject);
            },
            this
          );
        })
      );
    },

    _setDefaultSymbol: function(layerObject) {
      if (
        layerObject.geometryType === "esriGeometryPoint" ||
        layerObject.geometryType === "esriGeometryMultipoint"
      ) {
        layerObject.setSelectionSymbol(this.defaultPointSymbol);
      } else if (layerObject.geometryType === "esriGeometryPolyline") {
        layerObject.setSelectionSymbol(this.defaultLineSymbol);
      } else if (layerObject.geometryType === "esriGeometryPolygon") {
        layerObject.setSelectionSymbol(this.defaultFillSymbol);
      } else {
        console.warn("unknown geometryType: " + layerObject.geometryType);
      }
    },

    _restoreSelectionSymbol: function() {
      this._getLayerObjects().then(
        lang.hitch(this, function(layerObjects) {
          array.forEach(
            layerObjects,
            function(layerObject) {
              var symbolJson = this.selectionSymbols[layerObject.id];
              if (symbolJson) {
                layerObject.setSelectionSymbol(
                  SymbolJsonUtils.fromJson(symbolJson)
                );
              }
            },
            this
          );
        })
      );
    },

    _layerVisibilityChanged: function() {
      array.forEach(
        this.layerItems,
        function(layerItem) {
          layerItem.updateLayerVisibility();
        },
        this
      );
    },

    _getSelectableLayers: function() {
      var retDef = new Deferred();

      var selectedLayerInfo = [];
      array.forEach(
        this.layerItems,
        function(layerItem) {
          if (layerItem.isLayerVisible() && layerItem.isChecked()) {
            selectedLayerInfo.push(layerItem.layerInfo);
          }
        },
        this
      );

      this._getLayerObjects(selectedLayerInfo).then(function(layerObjects) {
        retDef.resolve(layerObjects);
      });

      return retDef;
    },

    _clearAllSelections: function() {
      this.trafficSQL.value = "";
      this.colorQuery.where = "";
      for (var i = 0; i < window.selected.length; i++) {
        window.selected.splice(i, 1);
      }
      var selectionMgr = SelectionManager.getInstance();
      this._getLayerObjects().then(function(layerObjects) {
        array.forEach(layerObjects, function(layerObject) {
          selectionMgr.clearSelection(layerObject);
        });
      });
      window.linkarrayndx = 0;
      window.selectnum = 0;
    },

    _getLayerObjects: function(layerInfoArray) {
      var retDef = new Deferred();

      if (!layerInfoArray) {
        layerInfoArray = this.layerInfoArray;
      }

      var defs = array.map(layerInfoArray, function(layerInfo) {
        return layerInfo.getLayerObject();
      });

      all(defs).then(function(layerObjects) {
        retDef.resolve(layerObjects);
      });

      return retDef;
    },

    _switchToDetails: function(layerItem) {
      html.empty(this.featureContent);
      this.viewStack.switchView(1);
      this.selectedLayerName.innerHTML = layerItem.layerName;
      console.log(layerItem.layerName);
      console.log(layerItem);

      layerItem.layerInfo.getLayerObject().then(
        lang.hitch(this, function(layerObject) {
          var selectedFeatures = layerObject.getSelectedFeatures();
          if (selectedFeatures.length > 0) {
            array.forEach(
              selectedFeatures,
              lang.hitch(this, function(feature) {
                var item = new FeatureItem({
                  //graphic: feature,
                  map: this.map,
                  featureLayer: layerObject,
                  displayField: layerObject.displayField,
                  objectIdField: layerObject.objectIdField,
                  allowExport: this.config ? this.config.allowExport : false,
                  nls: this.nls
                });
                html.place(item.domNode, this.featureContent);
                item.startup();
              })
            );
          }
          this.getSQL(this.layerItems); //dave note
        })
      );
    },

    _switchToLayerList: function() {
      this.viewStack.switchView(0);
    },

    getSQL: function(layerItem, rcheck, scheck, lcheck, ucheck) {
      var selectedlist = "(";

      //this is where the user selects the layer
      this.layerItems[0].layerInfo.getLayerObject().then(
        lang.hitch(this, function(layerObject) {
          // controls the layer from which we select, need to change this.layerItems[0] index

          var selectedFeatures = layerObject.getSelectedFeatures();
          window.selectndx = 0;
          var nextlrs = "";

          // If we want select for static filters
          // if (selectedFeatures[0].attributes.LRSID != undefined) {
          //   const attrLRSID = true;
          // } else {
          //   var keys = Object.keys(selectedFeatures);
          //   for (const str of keys)
          //     if (str.split("_")[1] == "LRSID" || str.split("_")[2] == "LRSID")
          //       attrLRSID = str;
          // }

          console.log(selectedFeatures);
          if (selectedFeatures.length > 0) {
            //* fill selected array
            // NEEDS SOME GOOD OLE FIXING
            array.forEach(
              selectedFeatures,
              lang.hitch(this, function(feature) {
                nextlrs = feature.attributes.LRSID;
                window.selected[window.selectndx] = nextlrs;
                window.selectndx = window.selectndx + 1;
              })
            );
            /**************  END OF FILL SELECTED SET ARRAY*/

            //if linkarray is empty
            if (window.linkarrayndx == -1) {
              for (i = 0; i < window.selectndx; i++) {
                if (rcheck || scheck || lcheck || ucheck) {
                  if (rcheck) {
                    window.linkarray.push(window.selected[i] + "R");
                    window.linkarrayndx = window.linkarrayndx + 1;
                  }
                  if (scheck) {
                    window.linkarray.push(window.selected[i] + "S");
                    window.linkarrayndx = window.linkarrayndx + 1;
                  }
                  if (lcheck) {
                    window.linkarray.push(window.selected[i] + "L");
                    window.linkarrayndx = window.linkarrayndx + 1;
                  }
                  if (ucheck) {
                    window.linkarray.push(window.selected[i] + "U");
                    window.linkarrayndx = window.linkarrayndx + 1;
                  }
                } else {
                  window.linkarray.push(window.selected[i]);
                  window.linkarrayndx = window.linkarrayndx + 1;
                }
              }
            }
            //if linkarray not empty
            else {
              var linkloop = window.linkarrayndx;
              for (i = 0; i < window.selectndx; i++) {
                selectedbefore = "no";

                for (j = 0; j <= linkloop; j++) {
                  if (
                    window.selected[i] == window.linkarray[j] ||
                    window.selected[i] == window.linkarray[j].substring(0, 16)
                  ) {
                    selectedbefore = "yes";
                  }
                }
                if (selectedbefore == "no") {
                  if (rcheck || scheck || lcheck || ucheck) {
                    if (rcheck) {
                      window.linkarrayndx = window.linkarrayndx + 1;
                      window.linkarray.push(window.selected[i] + "R");
                    }
                    if (scheck) {
                      window.linkarrayndx = window.linkarrayndx + 1;
                      window.linkarray.push(window.selected[i] + "S");
                    }
                    if (lcheck) {
                      window.linkarrayndx = window.linkarrayndx + 1;
                      window.linkarray.push(window.selected[i] + "L");
                    }
                    if (ucheck) {
                      window.linkarrayndx = window.linkarrayndx + 1;
                      window.linkarray.push(window.selected[i] + "U");
                    }
                  } else {
                    window.linkarrayndx = window.linkarrayndx + 1;
                    window.linkarray.push(window.selected[i]);
                  }
                }
              }
            }

            window.linkarray.sort();
            window.selected.sort();
            window.temparrayndx = -1;

            linkloop = window.linkarrayndx;
            for (i = 0; i < window.selectndx; i++) {
              for (j = 0; j <= linkloop; j++) {
                if (
                  window.selected[i] == window.linkarray[j].substring(0, 16) ||
                  window.selected[i] == window.linkarray[j]
                ) {
                  window.temparrayndx = window.temparrayndx + 1;
                  window.temparray[temparrayndx] = window.linkarray[j];
                }
              }
            }
            window.linkarray = window.temparray;
            window.linkarrayndx = window.temparrayndx;
          }
        })
      );

      if (this.colorQuery.where == "") {
        this.trafficSQL.value = "";
        var stop = window.selected.length;
        for (var i = 0; i < stop; i++) {
          if (rcheck || scheck || lcheck || ucheck) {
            if (rcheck) {
              window.selected.push(window.selected[i] + "R");
            }
            if (scheck) {
              window.selected.push(window.selected[i] + "S");
            }
            if (lcheck) {
              window.selected.push(window.selected[i] + "L");
            }
            if (ucheck) {
              window.selected.push(window.selected[i] + "U");
            }
          }
          this.trafficSQL.value += "'" + window.selected[i];

          this.trafficSQL.value += "',";
        }

        if (this.trafficSQL.value.indexOf("LRSID in") == -1) {
          this.trafficSQL.value = "LRSID in (" + this.trafficSQL.value;
        }

        if (this.trafficSQL.value.indexOf(")") == -1) {
          this.trafficSQL.value = this.trafficSQL.value.slice(0, -1);
          this.trafficSQL.value += ")";
        }
        window.trafficSQL.value = this.trafficSQL.value;
        window.boolcheck = false;
      } else if (this.colorQuery.where != "") {
        var temporaryColorQuery = this.colorQuery.where;
        temporaryColorQuery = temporaryColorQuery.slice(0, -1);
        temporaryColorQuery += ",";

        this.trafficSQL.value = "";

        for (var i = 0; i < window.selected.length; i++) {
          this.trafficSQL.value += "'" + window.selected[i] + "',";
        }

        if (this.trafficSQL.value.indexOf(")") == -1) {
          this.trafficSQL.value = this.trafficSQL.value.slice(0, -1);
          this.trafficSQL.value += ")";
        }

        this.trafficSQL.value = temporaryColorQuery + this.trafficSQL.value;
        window.boolcheck = true;
      }
    },

    dataD: function(results) {
      console.log(results);

      var drows = [];
      var datanames = [];
      datanames.push("OBJECTID");

      datanames.push("BLUESTAN");
      datanames.push("BLUESTA");
      datanames.push("LRSIDNUM");
      datanames.push("TRAVTIMEM");
      datanames.push("CNTSAMPLE");
      datanames.push("TRAVTIME");
      datanames.push("DATETIME");
      datanames.push("YEAR");
      datanames.push("MONTH");
      datanames.push("DAY");
      datanames.push("LRSID");
      datanames.push("HOUR");
      datanames.push("MIN_");
      datanames.push("INT");
      datanames.push("XREF");
      datanames.push("YREF");

      datanames.push("DATETIMNUM");
      datanames.push("DOWSUN");
      datanames.push("DOW");
      datanames.push("SPEED");
      datanames.push("METERS");
      datanames.push("MILES");
      datanames.push("TRAVHOURS");
      drows.push(datanames);

      for (var step = 0; step < results.features.length; step++) {
        var data = [];
        data.push(results.features[step].attributes.OBJECTID);

        data.push(results.features[step].attributes.BLUESTAN);
        data.push(results.features[step].attributes.BLUESTA);
        data.push(results.features[step].attributes.LRSIDNUM);
        data.push(results.features[step].attributes.TRAVTIMEM);
        data.push(results.features[step].attributes.CNTSAMPLE);
        data.push(results.features[step].attributes.TRAVTIME);
        data.push(results.features[step].attributes.DATETIME);
        data.push(results.features[step].attributes.YEAR);
        data.push(results.features[step].attributes.MONTH);
        data.push(results.features[step].attributes.DAY);
        data.push(results.features[step].attributes.LRSID);
        data.push(results.features[step].attributes.HOUR);
        data.push(results.features[step].attributes.MIN_);
        data.push(results.features[step].attributes.INT);
        data.push(results.features[step].attributes.XREF);
        data.push(results.features[step].attributes.YREF);

        data.push(results.features[step].attributes.DATETIMNUM);
        data.push(results.features[step].attributes.DOWSUN);
        data.push(results.features[step].attributes.DOW);
        data.push(results.features[step].attributes.SPEED);
        data.push(results.features[step].attributes.METERS);
        data.push(results.features[step].attributes.MILES);
        data.push(results.features[step].attributes.TRAVHOURS);
        drows.push(data);
      }
      console.log(drows);
      this.exportToCsv("datadump.csv", drows);
    },

    //loads filters from results
    loadFilters: function(results) {
      var resultCount = results.features.length;
      var ref = dojo.byId("filterDropListf");
      console.log({ results });
      //console.log(ref.options[ref.selectedIndex].text);
      var node = document.getElementById("filterDropListf");
      while (node.firstChild) node.removeChild(node.firstChild);
      theoption = document.createElement("option");
      console.log(resultCount + "lskdjfhlsjkhl");
      if (resultCount > 0) {
        theoption.text = "Select a filter";
        theoption.value = "Select a filter";
        dojo.byId("filterDropListf").add(dojo.create("option", theoption));
        for (var i = 0; i < resultCount; i++) {
          var featureAttributes = results.features[i].attributes;
          theoption.text = featureAttributes["SELNAME"];
          theoption.value = featureAttributes["SELNAME"];

          dojo.byId("filterDropListf").add(dojo.create("option", theoption));
        }
      } else {
        this.notifier("No filters found for user ${this.theUserF}");
        theoption.text = "none";
        theoption.value = "none";
        dojo.byId("filterDropListf").add(dojo.create("option", theoption));
        return 0;
      }
      for (var i = 0; i < this.filterDropListf.length; i++) {
        if (window.newfiltname == this.filterDropListf[i].value) {
          this.filterDropListf[i].selected = true;
          return 0;
        }
      }
    },

    //deletes the selected filter
    deleteFilter: function(results) {
      var resultCount = results.features.length;
      //alert(resultCount);
      if (resultCount > 0 && this.TheUserf.value != "none") {
        for (var i = 0; i < resultCount; i++) {
          var featureAttributes = results.features[i].attributes;
          this.theobjectid = featureAttributes["OBJECTID"];
          var url =
            "https://cadsrgis2.org/arcgis/rest/services/trafdata/filters/FeatureServer/0/deleteFeatures";
          var requestHandle = esriRequest(
            {
              url: url,
              content: {
                objectIds: this.theobjectid,
                f: "json"
              }
            },
            {
              usePost: true
            }
          );
          requestHandle.then();
        }
        this.s.innerHTML =
          "Status: Filter has been deleted from " + this.TheUserf.value;
        this.CurrentFilterf.value = "";
        this.filtquery.where = "USERNAME = '" + this.TheUserf.value + "'";
        //call loadfilter helper
        this.filtqueryTask.execute(
          this.filtquery,
          lang.hitch(this, this.loadFilters)
        );
      } else this.notifier(" Please select a filter to delete"); //this.s.innerHTML = "Status: Please select a filter to delete";
    },

    updateCustomFilter: function() {
      if (this.wkendChkBx.checked == true) {
        window.satChkBx = this.satChkBx.checked = true;
        window.sunChkBx = this.sunChkBx.checked = true;
      }

      if (this.wkdayChkBx.checked == true) {
        window.monChkBx = this.monChkBx.checked = true;
        window.tuesChkBx = this.tuesChkBx.checked = true;
        window.wedChkBx = this.wedChkBx.checked = true;
        window.thurChkBx = this.thurChkBx.checked = true;
        window.friChkBx = this.friChkBx.checked = true;
      }

      if (this.allyrChkBx.checked == true) {
        window.janChkBx.checked = this.janChkBx.checked = true;
        window.febChkBx.checked = this.febChkBx.checked = true;
        window.marChkBx.checked = this.marChkBx.checked = true;
        window.aprChkBx.checked = this.aprChkBx.checked = true;
        window.mayChkBx.checked = this.mayChkBx.checked = true;
        window.junChkBx.checked = this.junChkBx.checked = true;
        window.julChkBx.checked = this.julChkBx.checked = true;
        window.augChkBx.checked = this.augChkBx.checked = true;
        window.sepChkBx.checked = this.sepChkBx.checked = true;
        window.octChkBx.checked = this.octChkBx.checked = true;
        window.novChkBx.checked = this.novChkBx.checked = true;
        window.decChkBx.checked = this.decChkBx.checked = true;
      }

      if (this.schChkBx.checked == true) {
        window.janChkBx.checked = this.janChkBx.checked = true;
        window.febChkBx.checked = this.febChkBx.checked = true;
        window.marChkBx.checked = this.marChkBx.checked = true;
        window.aprChkBx.checked = this.aprChkBx.checked = true;
        window.mayChkBx.checked = this.mayChkBx.checked = true;
        window.sepChkBx.checked = this.sepChkBx.checked = true;
        window.octChkBx.checked = this.octChkBx.checked = true;
        window.novChkBx.checked = this.novChkBx.checked = true;
        window.decChkBx.checked = this.decChkBx.checked = true;
      }

      if (this.sumChkBx.checked == true) {
        window.junChkBx.checked = this.junChkBx.checked = true;
        window.julChkBx.checked = this.julChkBx.checked = true;
        window.augChkBx.checked = this.augChkBx.checked = true;
      }

      if (this.frstChkBx.checked == true) {
        window.janChkBx.checked = this.janChkBx.checked = true;
        window.febChkBx.checked = this.febChkBx.checked = true;
        window.marChkBx.checked = this.marChkBx.checked = true;
      }

      if (this.secChkBx.checked == true) {
        window.aprChkBx.checked = this.aprChkBx.checked = true;
        window.mayChkBx.checked = this.mayChkBx.checked = true;
        window.junChkBx.checked = this.junChkBx.checked = true;
      }

      if (this.thrdChkBx.checked == true) {
        window.julChkBx.checked = this.julChkBx.checked = true;
        window.augChkBx.checked = this.augChkBx.checked = true;
        window.sepChkBx.checked = this.sepChkBx.checked = true;
      }

      if (this.frthChkBx.checked == true) {
        window.octChkBx.checked = this.octChkBx.checked = true;
        window.novChkBx.checked = this.novChkBx.checked = true;
        window.decChkBx.checked = this.decChkBx.checked = true;
      }

      if (this.ampkChkBx.checked == true) {
        window.h7ChkBx.checked = this.h7ChkBx.checked = true;
        window.h8ChkBx.checked = this.h8ChkBx.checked = true;
        window.h9ChkBx.checked = this.h9ChkBx.checked = true;
      }

      if (this.pmpkChkBx.checked == true) {
        window.h16ChkBx.checked = this.h16ChkBx.checked = true;
        window.h17ChkBx.checked = this.h17ChkBx.checked = true;
        window.h18ChkBx.checked = this.h18ChkBx.checked = true;
      }

      if (this.midChkBx.checked == true) {
        window.h10ChkBx.checked = this.h10ChkBx.checked = true;
        window.h11ChkBx.checked = this.h11ChkBx.checked = true;
        window.h12ChkBx.checked = this.h12ChkBx.checked = true;
        window.h13ChkBx.checked = this.h13ChkBx.checked = true;
        window.h14ChkBx.checked = this.h14ChkBx.checked = true;
        window.h15ChkBx.checked = this.h15ChkBx.checked = true;
      }

      if (this.alldayChkBx.checked == true) {
        window.h23ChkBx.checked = this.h23ChkBx.checked = true;
        window.h22ChkBx.checked = this.h22ChkBx.checked = true;
        window.h21ChkBx.checked = this.h21ChkBx.checked = true;
        window.h20ChkBx.checked = this.h20ChkBx.checked = true;
        window.h19ChkBx.checked = this.h19ChkBx.checked = true;
        window.h18ChkBx.checked = this.h18ChkBx.checked = true;
        window.h17ChkBx.checked = this.h17ChkBx.checked = true;
        window.h16ChkBx.checked = this.h16ChkBx.checked = true;
        window.h15ChkBx.checked = this.h15ChkBx.checked = true;
        window.h14ChkBx.checked = this.h14ChkBx.checked = true;
        window.h13ChkBx.checked = this.h13ChkBx.checked = true;
        window.h12ChkBx.checked = this.h12ChkBx.checked = true;
        window.h11ChkBx.checked = this.h11ChkBx.checked = true;
        window.h10ChkBx.checked = this.h10ChkBx.checked = true;
        window.h9ChkBx.checked = this.h9ChkBx.checked = true;
        window.h8ChkBx.checked = this.h8ChkBx.checked = true;
        window.h7ChkBx.checked = this.h7ChkBx.checked = true;
        window.h6ChkBx.checked = this.h6ChkBx.checked = true;
        window.h5ChkBx.checked = this.h5ChkBx.checked = true;
        window.h4ChkBx.checked = this.h4ChkBx.checked = true;
        window.h3ChkBx.checked = this.h3ChkBx.checked = true;
        window.h2ChkBx.checked = this.h2ChkBx.checked = true;
        window.h1ChkBx.checked = this.h1ChkBx.checked = true;
        window.h0ChkBx.checked = this.h0ChkBx.checked = true;
      }
      // var filterBeginDate = new Date(dojo.byId("begindatepicker").value);
      // var filterEndDate = new Date(dojo.byId("enddatepicker").value);
      // window.filterEndDate = this.filterEndDate;
      // window.filterBeginDate = this.filterBeginDate;

      window.monChkBx = this.monChkBx.checked;
      window.tuesChkBx = this.tuesChkBx.checked;
      window.wedChkBx = this.wedChkBx.checked;
      window.thurChkBx = this.thurChkBx.checked;
      window.friChkBx = this.friChkBx.checked;
      window.satChkBx = this.satChkBx.checked;
      window.sunChkBx = this.sunChkBx.checked;
      window.febChkBx = this.febChkBx.checked;
      window.marChkBx = this.marChkBx.checked;
      window.aprChkBx = this.aprChkBx.checked;
      window.mayChkBx = this.mayChkBx.checked;
      window.junChkBx = this.junChkBx.checked;
      window.julChkBx = this.julChkBx.checked;
      window.augChkBx = this.augChkBx.checked;
      window.sepChkBx = this.sepChkBx.checked;
      window.octChkBx = this.octChkBx.checked;
      window.novChkBx = this.novChkBx.checked;
      window.decChkBx = this.decChkBx.checked;
      window.h0ChkBx = this.h0ChkBx.checked;
      window.h1ChkBx = this.h1ChkBx.checked;
      window.h2ChkBx = this.h2ChkBx.checked;
      window.h3ChkBx = this.h3ChkBx.checked;
      window.h4ChkBx = this.h4ChkBx.checked;
      window.h5ChkBx = this.h5ChkBx.checked;
      window.h6ChkBx = this.h6ChkBx.checked;
      window.h7ChkBx = this.h7ChkBx.checked;
      window.h8ChkBx = this.h8ChkBx.checked;
      window.h9ChkBx = this.h9ChkBx.checked;
      window.h10ChkBx = this.h10ChkBx.checked;
      window.h11ChkBx = this.h11ChkBx.checked;
      window.h12ChkBx = this.h12ChkBx.checked;
      window.h13ChkBx = this.h13ChkBx.checked;
      window.h14ChkBx = this.h14ChkBx.checked;
      window.h15ChkBx = this.h15ChkBx.checked;
      window.h16ChkBx = this.h16ChkBx.checked;
      window.h17ChkBx = this.h17ChkBx.checked;
      window.h18ChkBx = this.h18ChkBx.checked;
      window.h19ChkBx = this.h19ChkBx.checked;
      window.h20ChkBx = this.h20ChkBx.checked;
      window.h21ChkBx = this.h21ChkBx.checked;
      window.h22ChkBx = this.h22ChkBx.checked;
      window.h23ChkBx = this.h23ChkBx.checked;
      //window.int0ChkBx = this.int0ChkBx.checked;
      //window.int5ChkBx = this.int5ChkBx.checked;
      //window.int15ChkBx = this.int15ChkBx.checked;
      //window.hrintChkBx = this.hrintChkBx.checked;
      //window.dayintChkBx = this.dayintChkBx.checked;
      window.byvar1DropList = this.byvar1DropList.value;
      window.byvar2DropList = this.byvar2DropList.value;
      // window.begindatepicker = this.filterBeginDate;
      // window.enddatepicker = this.filterEndDate;
      window.allyrChkBx = this.allyrChkBx.checked;
      window.schChkBx = this.schChkBx.checked;
      window.sumChkBx = this.sumChkBx.checked;
      window.frstChkBx = this.frstChkBx.checked;
      window.secChkBx = this.secChkBx.checked;
      window.thrdChkBx = this.thrdChkBx.checked;
      window.frthChkBx = this.frthChkBx.checked;
      window.alldayChkBx = this.alldayChkBx.checked;
      window.ampkChkBx = this.ampkChkBx.checked;
      window.midChkBx = this.midChkBx.checked;
      window.pmpkChkBx = this.pmpkChkBx.checked;
      window.yr2008ChkBx = this.yr2008ChkBx.checked;
      window.yr2009ChkBx = this.yr2009ChkBx.checked;
      window.yr2010ChkBx = this.yr2010ChkBx.checked;
      window.yr2011ChkBx = this.yr2011ChkBx.checked;
      window.yr2012ChkBx = this.yr2012ChkBx.checked;
      window.yr2013ChkBx = this.yr2013ChkBx.checked;
      window.yr2014ChkBx = this.yr2014ChkBx.checked;
      window.yr2015ChkBx = this.yr2015ChkBx.checked;
      window.yr2016ChkBx = this.yr2016ChkBx.checked;
      window.yr2017ChkBx = this.yr2017ChkBx.checked;
      window.srcvalue = this.sourceDropList.value;
      //src value is used to determine where to query from. not necessarily needed as window variable but
      //doing it like the others atm.
      var attr = {
        USERNAME: this.TheUserf.value,
        SELNAME: this.CurrentFilterf.value,
        //"CUSTOMSQL":custsqlInput.value,
        MONCHK: this.monChkBx.checked,
        TUESCHK: this.tuesChkBx.checked,
        WEDCHK: this.wedChkBx.checked,
        THURCHK: this.thurChkBx.checked,
        FRICHK: this.friChkBx.checked,
        SATCHK: this.satChkBx.checked,
        SUNCHK: this.sunChkBx.checked,
        WEEKDAY: this.wkdayChkBx.checked,
        WEEKEND: this.wkendChkBx.checked,
        JANCHK: this.janChkBx.checked,
        FEBCHK: this.febChkBx.checked,
        MARCHK: this.marChkBx.checked,
        APRCHK: this.aprChkBx.checked,
        MAYCHK: this.mayChkBx.checked,
        JUNCHK: this.junChkBx.checked,
        JULCHK: this.julChkBx.checked,
        AUGCHK: this.augChkBx.checked,
        SEPCHK: this.sepChkBx.checked,
        OCTCHK: this.octChkBx.checked,
        NOVCHK: this.novChkBx.checked,
        DECCHK: this.decChkBx.checked,
        HR0: this.h0ChkBx.checked,
        HR1: this.h1ChkBx.checked,
        HR2: this.h2ChkBx.checked,
        HR3: this.h3ChkBx.checked,
        HR4: this.h4ChkBx.checked,
        HR5: this.h5ChkBx.checked,
        HR6: this.h6ChkBx.checked,
        HR7: this.h7ChkBx.checked,
        HR8: this.h8ChkBx.checked,
        HR9: this.h9ChkBx.checked,
        HR10: this.h10ChkBx.checked,
        HR11: this.h11ChkBx.checked,
        HR12: this.h12ChkBx.checked,
        HR13: this.h13ChkBx.checked,
        HR14: this.h14ChkBx.checked,
        HR15: this.h15ChkBx.checked,
        HR16: this.h16ChkBx.checked,
        HR17: this.h17ChkBx.checked,
        HR18: this.h18ChkBx.checked,
        HR19: this.h19ChkBx.checked,
        HR20: this.h20ChkBx.checked,
        HR21: this.h21ChkBx.checked,
        HR22: this.h22ChkBx.checked,
        HR23: this.h23ChkBx.checked,
        // BEGDAY: this.filterBeginDate.getDay() + 1,
        // BEGYEAR: this.filterBeginDate.getFullYear() - 2000,
        // ENDMONTH: this.filterEndDate.getMonth() + 1,
        // ENDDAY: this.filterEndDate.getDay() + 1,
        // ENDYEAR: this.filterEndDate.getFullYear() - 2000,
        //INT0: this.int0ChkBx.checked,
        //INT5: this.int5ChkBx.checked,
        //INT15: this.int15ChkBx.checked,
        //INTHR: this.hrintChkBx.checked,
        //INTDAY: this.dayintChkBx.checked,
        AGGVAR: this.aggtypeDropList.value,
        AGGBY1: this.byvar1DropList.value,
        AGGBY2: this.byvar2DropList.value,
        // BEGDATE: this.filterBeginDate,
        // ENDDATE: this.filterEndDate,
        ALLYR: this.allyrChkBx.checked,
        SCLYR: this.schChkBx.checked,
        SUMMER: this.sumChkBx.checked,
        Q1: this.frstChkBx.checked,
        Q2: this.secChkBx.checked,
        Q3: this.thrdChkBx.checked,
        Q4: this.frthChkBx.checked,
        ALLDAY: this.alldayChkBx.checked,
        AMPK: this.ampkChkBx.checked,
        MIDDAY: this.midChkBx.checked,
        PMPK: this.pmpkChkBx.checked,
        YR2008: this.yr2008ChkBx.checked,
        YR2009: this.yr2009ChkBx.checked,
        YR2010: this.yr2010ChkBx.checked,
        YR2011: this.yr2011ChkBx.checked,
        YR2012: this.yr2012ChkBx.checked,
        YR2013: this.yr2013ChkBx.checked,
        YR2014: this.yr2014ChkBx.checked,
        YR2015: this.yr2015ChkBx.checked,
        YR2016: this.yr2016ChkBx.checked,
        YR2017: this.yr2017ChkBx.checked,
        DESCRIP: this.descripTextf.value,
        source: this.sourceDropList.value
      };
      console.log(attr);
      // console.log(filterBeginDate.getFullYear() - 2000);
      // console.log(filterBeginDate.getDay() + 1);

      var pointLayer = new FeatureLayer(
        "https://cadsrgis2.org/arcgis/rest/services/trafdata/filters/FeatureServer/0",
        {
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
        }
      );
      var query = new esri.tasks.Query();
      query.outFields = ["*"];
      query.where = "1=1";
      pointLayer.queryFeatures(query, function(featureSet) {
        console.log(featureSet);
        window.features = featureSet.features;
        console.log(window.features);

        var f = window.features;

        for (var i = 0; i < this.filterDropListf.length; i++) {
          if (
            this.filterDropListf[i].value == attr.SELNAME &&
            this.filterDropListf[i].selected
          ) {
            console.log("yuh");

            window.filtflag = 1;
            var pt = new esri.geometry.Point(
              -8415982,
              4750944,
              new esri.SpatialReference({
                wkid: 102100
              })
            );
            for (i in featureSet.features) {
              if (
                f[i].attributes.USERNAME == this.TheUserf.value &&
                f[i].attributes.SELNAME == attr.SELNAME
              ) {
                attr["OBJECTID"] = f[i].attributes.OBJECTID;
                var addGraphic2 = new esri.Graphic(pt, null, attr, null);

                //addGraphic2.setAttributes( attr );
                pointLayer.applyEdits(null, [addGraphic2], null);

                console.log(f[i].attributes.SELNAME + " has been updated");
              }
            }
          }
        }
      });
      //window.descripText =  this.descripText.value;
    },

    updateWindowVars: function() {
      window.srcvalue = this.sourceDropList.value;
      window.yr2010ChkBxname = this.yr2010ChkBx.name;
      window.yr2010ChkBxvalue = this.yr2010ChkBx.value;
      window.yr2011ChkBxname = this.yr2011ChkBx.name;
      window.yr2011ChkBxvalue = this.yr2011ChkBx.value;
      window.yr2012ChkBxname = this.yr2012ChkBx.name;
      window.yr2012ChkBxvalue = this.yr2012ChkBx.value;
      window.yr2013ChkBxname = this.yr2013ChkBx.name;
      window.yr2013ChkBxvalue = this.yr2013ChkBx.value;
      window.yr2014ChkBxname = this.yr2014ChkBx.name;
      window.yr2014ChkBxvalue = this.yr2014ChkBx.value;
      window.yr2015ChkBxname = this.yr2015ChkBx.name;
      window.yr2015ChkBxvalue = this.yr2015ChkBx.value;
      window.yr2016ChkBxname = this.yr2016ChkBx.name;
      window.yr2016ChkBxvalue = this.yr2016ChkBx.value;
      window.yr2017ChkBxname = this.yr2017ChkBx.name;
      window.yr2017ChkBxvalue = this.yr2017ChkBx.value;
      window.monChkBxname = this.monChkBx.name;
      window.monChkBxvalue = this.monChkBx.value;
      window.tuesChkBxname = this.tuesChkBx.name;
      window.tuesChkBxvalue = this.tuesChkBx.value;
      window.wedChkBxname = this.wedChkBx.name;
      window.wedChkBxvalue = this.wedChkBx.value;
      window.thurChkBxname = this.thurChkBx.name;
      window.thurChkBxvalue = this.thurChkBx.value;
      window.friChkBxname = this.friChkBx.name;
      window.friChkBxvalue = this.friChkBx.value;
      window.satChkBxname = this.satChkBx.name;
      window.satChkBxvalue = this.satChkBx.value;
      window.sunChkBxname = this.sunChkBx.name;
      window.sunChkBxvalue = this.sunChkBx.value;
      window.janChkBxname = this.janChkBx.name;
      window.janChkBxvalue = this.janChkBx.value;
      window.febChkBxname = this.febChkBx.name;
      window.febChkBxvalue = this.febChkBx.value;
      window.marChkBxname = this.marChkBx.name;
      window.marChkBxvalue = this.marChkBx.value;
      window.aprChkBxname = this.aprChkBx.name;
      window.aprChkBxvalue = this.aprChkBx.value;
      window.mayChkBxname = this.mayChkBx.name;
      window.mayChkBxvalue = this.mayChkBx.value;
      window.junChkBxname = this.junChkBx.name;
      window.junChkBxvalue = this.junChkBx.value;
      window.julChkBxname = this.julChkBx.name;
      window.julChkBxvalue = this.julChkBx.value;
      window.augChkBxname = this.augChkBx.name;
      window.augChkBxvalue = this.augChkBx.value;
      window.sepChkBxname = this.sepChkBx.name;
      window.sepChkBxvalue = this.sepChkBx.value;
      window.octChkBxname = this.octChkBx.name;
      window.octChkBxvalue = this.octChkBx.value;
      window.novChkBxname = this.novChkBx.name;
      window.novChkBxvalue = this.novChkBx.value;
      window.decChkBxname = this.decChkBx.name;
      window.decChkBxvalue = this.decChkBx.value;
      window.h0ChkBxname = this.h0ChkBx.name;
      window.h0ChkBxvalue = this.h0ChkBx.value;
      window.h1ChkBxname = this.h1ChkBx.name;
      window.h1ChkBxvalue = this.h1ChkBx.value;
      window.h2ChkBxname = this.h2ChkBx.name;
      window.h2ChkBxvalue = this.h2ChkBx.value;
      window.h3ChkBxname = this.h3ChkBx.name;
      window.h3ChkBxvalue = this.h3ChkBx.value;
      window.h4ChkBxname = this.h4ChkBx.name;
      window.h4ChkBxvalue = this.h4ChkBx.value;
      window.h5ChkBxname = this.h5ChkBx.name;
      window.h5ChkBxvalue = this.h5ChkBx.value;
      window.h6ChkBxname = this.h6ChkBx.name;
      window.h6ChkBxvalue = this.h6ChkBx.value;
      window.h7ChkBxname = this.h7ChkBx.name;
      window.h7ChkBxvalue = this.h7ChkBx.value;
      window.h8ChkBxname = this.h8ChkBx.name;
      window.h8ChkBxvalue = this.h8ChkBx.value;
      window.h9ChkBxname = this.h9ChkBx.name;
      window.h9ChkBxvalue = this.h9ChkBx.value;
      window.h10ChkBxname = this.h10ChkBx.name;
      window.h10ChkBxvalue = this.h10ChkBx.value;
      window.h11ChkBxname = this.h11ChkBx.name;
      window.h11ChkBxvalue = this.h11ChkBx.value;
      window.h12ChkBxname = this.h12ChkBx.name;
      window.h12ChkBxvalue = this.h12ChkBx.value;
      window.h13ChkBxname = this.h13ChkBx.name;
      window.h13ChkBxvalue = this.h13ChkBx.value;
      window.h14ChkBxname = this.h14ChkBx.name;
      window.h14ChkBxvalue = this.h14ChkBx.value;
      window.h15ChkBxname = this.h15ChkBx.name;
      window.h15ChkBxvalue = this.h15ChkBx.value;
      window.h16ChkBxname = this.h16ChkBx.name;
      window.h16ChkBxvalue = this.h16ChkBx.value;
      window.h17ChkBxname = this.h17ChkBx.name;
      window.h17ChkBxvalue = this.h17ChkBx.value;
      window.h18ChkBxname = this.h18ChkBx.name;
      window.h18ChkBxvalue = this.h18ChkBx.value;
      window.h19ChkBxname = this.h19ChkBx.name;
      window.h19ChkBxvalue = this.h19ChkBx.value;
      window.h20ChkBxname = this.h20ChkBx.name;
      window.h20ChkBxvalue = this.h20ChkBx.value;
      window.h21ChkBxname = this.h21ChkBx.name;
      window.h21ChkBxvalue = this.h21ChkBx.value;
      window.h22ChkBxname = this.h22ChkBx.name;
      window.h22ChkBxvalue = this.h22ChkBx.value;
      window.h23ChkBxname = this.h23ChkBx.name;
      window.h23ChkBxvalue = this.h23ChkBx.value;
      //window.int0ChkBxname = this.int0ChkBx.name;
      //window.int0ChkBxvalue = this.int0ChkBx.value;
      //window.int5ChkBxname = this.int5ChkBx.name;
      //window.int5ChkBxvalue = this.int5ChkBx.value;
      //window.int15ChkBxname = this.int15ChkBx.name;
      //window.int15ChkBxvalue = this.int15ChkBx.value;
      //window.hrintChkBxname = this.hrintChkBx.name;
      //window.hrintChkBxvalue = this.hrintChkBx.value;
      //window.dayintChkBxname = this.dayintChkBx.name;
      //window.dayintChkBxvalue = this.dayintChkBx.value;
      window.alldayChkBxname = this.alldayChkBx.checked;
      window.wkdayChkBxname = this.wkdayChkBx.name;
      window.wkdayChkBxvalue = this.wkdayChkBx.value;
      window.wkendChkBxname = this.wkendChkBx.name;
      window.wkendChkBxvalue = this.wkendChkBx.value;
      window.ampkChkBxname = this.ampkChkBx.name;
      window.midChkBxname = this.midChkBx.name;
      window.pmpkChkBxname = this.pmpkChkBx.name;
      window.alldayChkBxname = this.alldayChkBx.name;
      window.ampkChkBxvalue = this.ampkChkBx.value;
      window.midChkBxvalue = this.midChkBx.value;
      window.pmpkChkBxvalue = this.pmpkChkBx.value;
      window.alldayChkBxvalue = this.alldayChkBx.value;
    },

    clearChecks: function() {
      ////window.int0ChkBx = this.int0ChkBx.checked = false;
      ////window.int5ChkBx = this.int5ChkBx.checked = false;
      ////window.int15ChkBx = this.int15ChkBx.checked = false;
      ////window.hrintChkBx = this.hrintChkBx.checked = false;
      ////window.dayintChkBx = this.dayintChkBx.checked = false;
      window.yr2008ChkBx = this.yr2008ChkBx.checked = false;
      window.yr2009ChkBx = this.yr2009ChkBx.checked = false;
      window.yr2010ChkBx = this.yr2010ChkBx.checked = false;
      window.yr2011ChkBx = this.yr2011ChkBx.checked = false;
      window.yr2012ChkBx = this.yr2012ChkBx.checked = false;
      window.yr2013ChkBx = this.yr2013ChkBx.checked = false;
      window.yr2014ChkBx = this.yr2014ChkBx.checked = false;
      window.yr2015ChkBx = this.yr2015ChkBx.checked = false;
      window.yr2016ChkBx = this.yr2016ChkBx.checked = false;
      window.yr2017ChkBx = this.yr2017ChkBx.checked = false;
      window.satChkBx = this.satChkBx.checked = false;
      window.sunChkBx = this.sunChkBx.checked = false;
      window.monChkBx = this.monChkBx.checked = false;
      window.tuesChkBx = this.tuesChkBx.checked = false;
      window.wedChkBx = this.wedChkBx.checked = false;
      window.thurChkBx = this.thurChkBx.checked = false;
      window.friChkBx = this.friChkBx.checked = false;
      window.janChkBx.checked = this.janChkBx.checked = false;
      window.febChkBx.checked = this.febChkBx.checked = false;
      window.marChkBx.checked = this.marChkBx.checked = false;
      window.aprChkBx.checked = this.aprChkBx.checked = false;
      window.mayChkBx.checked = this.mayChkBx.checked = false;
      window.junChkBx.checked = this.junChkBx.checked = false;
      window.julChkBx.checked = this.julChkBx.checked = false;
      window.augChkBx.checked = this.augChkBx.checked = false;
      window.sepChkBx.checked = this.sepChkBx.checked = false;
      window.octChkBx.checked = this.octChkBx.checked = false;
      window.novChkBx.checked = this.novChkBx.checked = false;
      window.decChkBx.checked = this.decChkBx.checked = false;
      window.wkendChkBx.checked = this.wkendChkBx.checked = false;
      window.alldayChkBx.checked = this.alldayChkBx.checked = false;
      window.wkdayChkBx.checked = this.wkdayChkBx.checked = false;
      window.schChkBx.checked = this.schChkBx.checked = false;
      window.sumChkBx.checked = this.sumChkBx.checked = false;
      window.frstChkBx.checked = this.frstChkBx.checked = false;
      window.secChkBx.checked = this.secChkBx.checked = false;
      window.thrdChkBx.checked = this.thrdChkBx.checked = false;
      window.frthChkBx.checked = this.frthChkBx.checked = false;
      window.ampkChkBx.checked = this.ampkChkBx.checked = false;
      window.pmpkChkBx.checked = this.pmpkChkBx.checked = false;
      window.midChkBx.checked = this.midChkBx.checked = false;
      window.allyrChkBx.checked = this.allyrChkBx.checked = false;
      window.h0ChkBx.checked = this.h0ChkBx.checked = false;
      window.h1ChkBx.checked = this.h1ChkBx.checked = false;
      window.h2ChkBx.checked = this.h2ChkBx.checked = false;
      window.h3ChkBx.checked = this.h3ChkBx.checked = false;
      window.h4ChkBx.checked = this.h4ChkBx.checked = false;
      window.h5ChkBx.checked = this.h5ChkBx.checked = false;
      window.h6ChkBx.checked = this.h6ChkBx.checked = false;
      window.h7ChkBx.checked = this.h7ChkBx.checked = false;
      window.h8ChkBx.checked = this.h8ChkBx.checked = false;
      window.h9ChkBx.checked = this.h9ChkBx.checked = false;
      window.h10ChkBx.checked = this.h10ChkBx.checked = false;
      window.h11ChkBx.checked = this.h11ChkBx.checked = false;
      window.h12ChkBx.checked = this.h12ChkBx.checked = false;
      window.h13ChkBx.checked = this.h13ChkBx.checked = false;
      window.h14ChkBx.checked = this.h14ChkBx.checked = false;
      window.h15ChkBx.checked = this.h15ChkBx.checked = false;
      window.h16ChkBx.checked = this.h16ChkBx.checked = false;
      window.h17ChkBx.checked = this.h17ChkBx.checked = false;
      window.h18ChkBx.checked = this.h18ChkBx.checked = false;
      window.h19ChkBx.checked = this.h19ChkBx.checked = false;
      window.h20ChkBx.checked = this.h20ChkBx.checked = false;
      window.h21ChkBx.checked = this.h21ChkBx.checked = false;
      window.h22ChkBx.checked = this.h22ChkBx.checked = false;
      window.h23ChkBx.checked = this.h23ChkBx.checked = false;
      lang.hitch(this, this.updateCustomFilter());
    },

    loadFilterDataf: function(results) {
      var featureAttributes = results.features[0].attributes;
      console.log(results.features[0].attributes);

      window.srcvalue = featureAttributes["source"];
      window.monChkBx = featureAttributes["MONCHK"];
      window.tuesChkBx = featureAttributes["TUESCHK"];
      window.wedChkBx = featureAttributes["WEDCHK"];
      window.thurChkBx = featureAttributes["THURCHK"];
      window.friChkBx = featureAttributes["FRICHK"];
      window.satChkBx = featureAttributes["SATCHK"];
      window.sunChkBx = featureAttributes["SUNCHK"];
      window.wkdayChkBx = featureAttributes["WEEKDAY"];
      window.wkendChkBx = featureAttributes["WEEKEND"];
      window.janChkBx = featureAttributes["JANCHK"];
      window.febChkBx = featureAttributes["FEBCHK"];
      window.marChkBx = featureAttributes["MARCHK"];
      window.aprChkBx = featureAttributes["APRCHK"];
      window.mayChkBx = featureAttributes["MAYCHK"];
      window.junChkBx = featureAttributes["JUNCHK"];
      window.julChkBx = featureAttributes["JULCHK"];
      window.augChkBx = featureAttributes["AUGCHK"];
      window.sepChkBx = featureAttributes["SEPCHK"];
      window.octChkBx = featureAttributes["OCTCHK"];
      window.novChkBx = featureAttributes["NOVCHK"];
      window.decChkBx = featureAttributes["DECCHK"];
      window.h0ChkBx = featureAttributes["HR0"];
      window.h1ChkBx = featureAttributes["HR1"];
      window.h2ChkBx = featureAttributes["HR2"];
      window.h3ChkBx = featureAttributes["HR3"];
      window.h4ChkBx = featureAttributes["HR4"];
      window.h5ChkBx = featureAttributes["HR5"];
      window.h6ChkBx = featureAttributes["HR6"];
      window.h7ChkBx = featureAttributes["HR7"];
      window.h8ChkBx = featureAttributes["HR8"];
      window.h9ChkBx = featureAttributes["HR9"];
      window.h10ChkBx = featureAttributes["HR10"];
      window.h11ChkBx = featureAttributes["HR11"];
      window.h12ChkBx = featureAttributes["HR12"];
      window.h13ChkBx = featureAttributes["HR13"];
      window.h14ChkBx = featureAttributes["HR14"];
      window.h15ChkBx = featureAttributes["HR15"];
      window.h16ChkBx = featureAttributes["HR16"];
      window.h17ChkBx = featureAttributes["HR17"];
      window.h18ChkBx = featureAttributes["HR18"];
      window.h19ChkBx = featureAttributes["HR19"];
      window.h20ChkBx = featureAttributes["HR20"];
      window.h21ChkBx = featureAttributes["HR21"];
      window.h22ChkBx = featureAttributes["HR22"];
      window.h23ChkBx = featureAttributes["HR23"];
      // console.log(window.filterBeginDate);
      // console.log(featureAttributes["BEGDAY"]);
      // window.filterBeginDate.setDay(featureAttributes["BEGDAY"]);
      // window.filterBeginDate.setFullYear(featureAttributes["BEGYEAR"] - 2000);
      // window.filterEndDate.setMonth(featureAttributes["ENDMONTH"] + 1);
      // window.filterEndDate.setDay(featureAttributes["ENDDAY"] + 1);
      // window.filterEndDate.setFullYear(featureAttributes["ENDYEAR"]);
      //window.int0ChkBx = featureAttributes["INT0"];
      //window.int5ChkBx = featureAttributes["INT5"];
      //window.int15ChkBx = featureAttributes["INT15"];
      //window.hrintChkBx = featureAttributes["INTHR"];
      //window.dayintChkBx = featureAttributes["INTDAY"];
      window.aggtypeDropList = featureAttributes["AGGVAR"];
      window.byvar1DropList = featureAttributes["AGGBY1"];
      window.byvar2DropList = featureAttributes["AGGBY2"];
      //window.filterBeginDate = featureAttributes["BEGDATE"];
      //this.begindatepicker.value = featureAttributes["BEGDATE"];
      //window.filterEndDate = featureAttributes["ENDDATE"];
      //this.enddatepicker.value = featureAttributes["ENDDATE"];
      window.allyrChkBx = featureAttributes["ALLYR"];
      window.schChkBx = featureAttributes["SCLYR"];
      window.sumChkBx = featureAttributes["SUMMER"];
      window.frstChkBx = featureAttributes["Q1"];
      window.secChkBx = featureAttributes["Q2"];
      window.thrdChkBx = featureAttributes["Q3"];
      window.frthChkBx = featureAttributes["Q4"];
      window.alldayChkBx = featureAttributes["ALLDAY"];
      window.ampkChkBx = featureAttributes["AMPK"];
      window.midChkBx = featureAttributes["MIDDAY"];
      window.pmpkChkBx = featureAttributes["PMPK"];
      window.minChkBx = featureAttributes["MIN0"];
      window.min15ChkBx = featureAttributes["MIN15"];
      window.min30ChkBx = featureAttributes["MIN30"];
      window.min45ChkBx = featureAttributes["MIN45"];
      window.yr2008ChkBx = featureAttributes["YR2008"];
      window.yr2009ChkBx = featureAttributes["YR2009"];
      window.yr2010ChkBx = featureAttributes["YR2010"];
      window.yr2011ChkBx = featureAttributes["YR2011"];
      window.yr2012ChkBx = featureAttributes["YR2012"];
      window.yr2013ChkBx = featureAttributes["YR2013"];
      window.yr2014ChkBx = featureAttributes["YR2014"];
      window.yr2015ChkBx = featureAttributes["YR2015"];
      window.yr2016ChkBx = featureAttributes["YR2016"];
      window.yr2017ChkBx = featureAttributes["YR2017"];
      window.descripText = featureAttributes["DESCRIP"];

      this.descripTextf.value = featureAttributes["DESCRIP"];
      this.monChkBx.checked = featureAttributes["MONCHK"];
      this.tuesChkBx.checked = featureAttributes["TUESCHK"];
      this.wedChkBx.checked = featureAttributes["WEDCHK"];
      this.thurChkBx.checked = featureAttributes["THURCHK"];
      this.friChkBx.checked = featureAttributes["FRICHK"];
      this.satChkBx.checked = featureAttributes["SATCHK"];
      this.sunChkBx.checked = featureAttributes["SUNCHK"];
      this.wkdayChkBx.checked = featureAttributes["WEEKDAY"];
      this.wkendChkBx.checked = featureAttributes["WEEKEND"];
      if (this.wkendChkBx.checked == true) {
        this.satChkBx.checked = true;
        this.sunChkBx.checked = true;
        window.satChkBx = this.satChkBx.checked;
        window.sunChkBx = this.sunChkBx.checked;
      }
      if (this.wkdayChkBx.checked == true) {
        this.monChkBx.checked = true;
        this.tuesChkBx.checked = true;
        this.wedChkBx.checked = true;
        this.thurChkBx.checked = true;
        this.friChkBx.checked = true;
        window.monChkBx = this.monChkBx.checked;
        window.tuesChkBx = this.tuesChkBx.checked;
        window.wedChkBx = this.wedChkBx.checked;
        window.thurChkBx = this.thurChkBx.checked;
        window.friChkBx = this.friChkBx.checked;
      }
      this.janChkBx.checked = featureAttributes["JANCHK"];
      this.febChkBx.checked = featureAttributes["FEBCHK"];
      this.marChkBx.checked = featureAttributes["MARCHK"];
      this.aprChkBx.checked = featureAttributes["APRCHK"];
      this.mayChkBx.checked = featureAttributes["MAYCHK"];
      this.junChkBx.checked = featureAttributes["JUNCHK"];
      this.julChkBx.checked = featureAttributes["JULCHK"];
      this.augChkBx.checked = featureAttributes["AUGCHK"];
      this.sepChkBx.checked = featureAttributes["SEPCHK"];
      this.octChkBx.checked = featureAttributes["OCTCHK"];
      this.novChkBx.checked = featureAttributes["NOVCHK"];
      this.decChkBx.checked = featureAttributes["DECCHK"];
      this.h1ChkBx.checked = featureAttributes["HR1"];
      this.h2ChkBx.checked = featureAttributes["HR2"];
      this.h3ChkBx.checked = featureAttributes["HR3"];
      this.h4ChkBx.checked = featureAttributes["HR4"];
      this.h5ChkBx.checked = featureAttributes["HR5"];
      this.h6ChkBx.checked = featureAttributes["HR6"];
      this.h7ChkBx.checked = featureAttributes["HR7"];
      this.h8ChkBx.checked = featureAttributes["HR8"];
      this.h9ChkBx.checked = featureAttributes["HR9"];
      this.h10ChkBx.checked = featureAttributes["HR10"];
      this.h11ChkBx.checked = featureAttributes["HR11"];
      this.h12ChkBx.checked = featureAttributes["HR12"];
      this.h13ChkBx.checked = featureAttributes["HR13"];
      this.h14ChkBx.checked = featureAttributes["HR14"];
      this.h15ChkBx.checked = featureAttributes["HR15"];
      this.h16ChkBx.checked = featureAttributes["HR16"];
      this.h17ChkBx.checked = featureAttributes["HR17"];
      this.h18ChkBx.checked = featureAttributes["HR18"];
      this.h19ChkBx.checked = featureAttributes["HR19"];
      this.h20ChkBx.checked = featureAttributes["HR20"];
      this.h21ChkBx.checked = featureAttributes["HR21"];
      this.h22ChkBx.checked = featureAttributes["HR22"];
      this.h23ChkBx.checked = featureAttributes["HR23"];
      // this.filterBeginDate.setDay(featureAttributes["BEGDAY"] + 1);
      // this.filterBeginDate.setFullYear(featureAttributes["BEGYEAR"] - 2000);
      // this.filterEndDate.setMonth(featureAttributes["ENDMONTH"] + 1);
      // this.filterEndDate.setDay(featureAttributes["ENDDAY"] + 1);
      // this.filterEndDate.setFullYear(featureAttributes["ENDYEAR"]);
      //this.int0ChkBx.checked = featureAttributes["INT0"];
      //this.int5ChkBx.checked = featureAttributes["INT5//"];
      //this.int15ChkBx.checked = featureAttributes["INT15"];
      //this.hrintChkBx.checked = featureAttributes["INTHR"];
      //this.dayintChkBx.checked = featureAttributes["INTDAY"];
      this.aggtypeDropList.value = featureAttributes["AGGVAR"];
      this.byvar1DropList.value = featureAttributes["AGGBY1"];
      this.byvar2DropList.value = featureAttributes["AGGBY2"];
      // this.filterBeginDate = featureAttributes["BEGDATE"];
      // this.filterEndDate = featureAttributes["ENDDATE"];
      this.allyrChkBx.checked = featureAttributes["ALLYR"];
      this.schChkBx.checked = featureAttributes["SCLYR"];
      this.sumChkBx.checked = featureAttributes["SUMMER"];
      this.frstChkBx.checked = featureAttributes["Q1"];
      this.secChkBx.checked = featureAttributes["Q2"];
      this.thrdChkBx.checked = featureAttributes["Q3"];
      this.frthChkBx.checked = featureAttributes["Q4"];
      this.alldayChkBx.checked = featureAttributes["ALLDAY"];
      this.ampkChkBx.checked = featureAttributes["AMPK"];
      this.midChkBx.checked = featureAttributes["MIDDAY"];
      this.pmpkChkBx.checked = featureAttributes["PMPK"];
      this.yr2008ChkBx.checked = featureAttributes["YR2008"];
      this.yr2009ChkBx.checked = featureAttributes["YR2009"];
      this.yr2010ChkBx.checked = featureAttributes["YR2010"];
      this.yr2011ChkBx.checked = featureAttributes["YR2011"];
      this.yr2012ChkBx.checked = featureAttributes["YR2012"];
      this.yr2013ChkBx.checked = featureAttributes["YR2013"];
      this.yr2014ChkBx.checked = featureAttributes["YR2014"];
      this.yr2015ChkBx.checked = featureAttributes["YR2015"];
      this.yr2016ChkBx.checked = featureAttributes["YR2016"];
      this.yr2017ChkBx.checked = featureAttributes["YR2017"];
      this.descripTextf.value = featureAttributes["DESCRIP"];
      //add src
      this.sourceDropList.value = featureAttributes["source"];

      window.srcvalue = this.sourceDropList.value;
      console.log(window.srcvalue);

      window.monChkBx = this.monChkBx.checked;
      window.tuesChkBx = this.tuesChkBx.checked;
      window.wedChkBx = this.wedChkBx.checked;
      window.thurChkBx = this.thurChkBx.checked;
      window.friChkBx = this.friChkBx.checked;
      window.satChkBx = this.satChkBx.checked;
      window.sunChkBx = this.sunChkBx.checked;
      window.wkdayChkBx = this.wkdayChkBx.checked;
      window.wkendChkBx = this.wkendChkBx.checked;
      window.janChkBx = this.janChkBx.checked;
      window.febChkBx = this.febChkBx.checked;
      window.marChkBx = this.marChkBx.checked;
      window.aprChkBx = this.aprChkBx.checked;
      window.mayChkBx = this.mayChkBx.checked;
      window.junChkBx = this.junChkBx.checked;
      window.julChkBx = this.julChkBx.checked;
      window.augChkBx = this.augChkBx.checked;
      window.sepChkBx = this.sepChkBx.checked;
      window.octChkBx = this.octChkBx.checked;
      window.novChkBx = this.novChkBx.checked;
      window.decChkBx = this.decChkBx.checked;
      window.h0ChkBx = this.h0ChkBx.checked;
      window.h1ChkBx = this.h1ChkBx.checked;
      window.h2ChkBx = this.h2ChkBx.checked;
      window.h3ChkBx = this.h3ChkBx.checked;
      window.h4ChkBx = this.h4ChkBx.checked;
      window.h5ChkBx = this.h5ChkBx.checked;
      window.h6ChkBx = this.h6ChkBx.checked;
      window.h7ChkBx = this.h7ChkBx.checked;
      window.h8ChkBx = this.h8ChkBx.checked;
      window.h9ChkBx = this.h9ChkBx.checked;
      window.h10ChkBx = this.h10ChkBx.checked;
      window.h11ChkBx = this.h11ChkBx.checked;
      window.h12ChkBx = this.h12ChkBx.checked;
      window.h13ChkBx = this.h13ChkBx.checked;
      window.h14ChkBx = this.h14ChkBx.checked;
      window.h15ChkBx = this.h15ChkBx.checked;
      window.h16ChkBx = this.h16ChkBx.checked;
      window.h17ChkBx = this.h17ChkBx.checked;
      window.h18ChkBx = this.h18ChkBx.checked;
      window.h19ChkBx = this.h19ChkBx.checked;
      window.h20ChkBx = this.h20ChkBx.checked;
      window.h21ChkBx = this.h21ChkBx.checked;
      window.h22ChkBx = this.h22ChkBx.checked;
      window.h23ChkBx = this.h23ChkBx.checked;
      //window.int0ChkBx = this.int0ChkBx.checked;
      //window.int5ChkBx = this.int5ChkBx.checked;
      //window.int15ChkBx = this.int15ChkBx.checked;
      //window.hrintChkBx = this.hrintChkBx.checked;
      //window.dayintChkBx = this.dayintChkBx.checked;
      window.aggtypeDropList = this.aggtypeDropList.value;
      window.byvar1DropList = this.byvar1DropList.value;
      window.byvar2DropList = this.byvar2DropList.value;
      // window.begindatepicker = filterBeginDate;
      // window.enddatepicker = filterEndDate;
      window.allyrChkBx = this.allyrChkBx.checked;
      window.schChkBx = this.schChkBx.checked;
      window.sumChkBx = this.sumChkBx.checked;
      window.frstChkBx = this.frstChkBx.checked;
      window.secChkBx = this.secChkBx.checked;
      window.thrdChkBx = this.thrdChkBx.checked;
      window.frthChkBx = this.frthChkBx.checked;
      window.alldayChkBx = this.alldayChkBx.checked;
      window.ampkChkBx = this.ampkChkBx.checked;
      window.midChkBx = this.midChkBx.checked;
      window.pmpkChkBx = this.pmpkChkBx.checked;
      window.yr2008ChkBx = this.yr2008ChkBx.checked;
      window.yr2009ChkBx = this.yr2009ChkBx.checked;
      window.yr2010ChkBx = this.yr2010ChkBx.checked;
      window.yr2011ChkBx = this.yr2011ChkBx.checked;
      window.yr2012ChkBx = this.yr2012ChkBx.checked;
      window.yr2013ChkBx = this.yr2013ChkBx.checked;
      window.yr2014ChkBx = this.yr2014ChkBx.checked;
      window.yr2015ChkBx = this.yr2015ChkBx.checked;
      window.yr2016ChkBx = this.yr2016ChkBx.checked;
      window.yr2017ChkBx = this.yr2017ChkBx.checked;
    },

    loadSelectFilters: function(results) {
      //SelectTrans Load Filter
      var resultCount = results.features.length;
      var ref = dojo.byId("filterDropList");
      ref.options[ref.selectedIndex].text = "none";

      //empties
      var snode = document.getElementById("filterDropList");
      while (snode.firstChild) snode.removeChild(snode.firstChild);
      theoption = document.createElement("option");
      if (resultCount > 0) {
        theoption.text = "Select a filter";
        theoption.value = "Select a filter";
        dojo.byId("filterDropList").add(dojo.create("option", theoption));
        for (var i = 0; i < resultCount; i++) {
          var featureAttributes = results.features[i].attributes;
          theoption.text = featureAttributes["SELNAME"];
          theoption.value = featureAttributes["SELNAME"];
          dojo.byId("filterDropList").add(dojo.create("option", theoption));
        }
      } else {
        theoption.text = "none";
        theoption.value = "none";
        dojo.byId("filterDropList").add(dojo.create("option", theoption));
      }
    },

    loadFilterData: function(results) {
      //SelectTrans PUSH
      this.loadFilterDataf(results);
      console.log(window.srcvalue);
      console.log(window.featureAttributes);
      var selected = [];
      var variables = {
        year: [],
        DOW: [], //day of week
        month: [],
        period: [],
        interval: [],
        hour: []
      };

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

      //if (window.int0ChkBx != 0) {
      //  window.int0ChkBxvalue = 0;
      //  selected.push(window.int0ChkBxname);
      //  selected.push(window.int0ChkBxvalue);
      //}
      //if (window.int5ChkBx != 0) {
      //  window.int5ChkBxvalue = 5;
      //  selected.push(window.int5ChkBxname);
      //  selected.push(window.int5ChkBxvalue);
      //}
      //if (window.int15ChkBx != 0) {
      //  window.int15ChkBxvalue = 15;
      //  selected.push(window.int15ChkBxname);
      //  selected.push(window.int15ChkBxvalue);
      //}
      //if (window.hrintChkBx != 0) {
      //  window.hrintChkBxvalue = 60;
      //  selected.push(window.hrintChkBxname);
      //  selected.push(window.hrintChkBxvalue);
      //}
      //if (window.dayintChkBx != 0) {
      //  window.dayintChkBxvalue = 24;
      //  selected.push(window.dayintChkBxname);
      //  selected.push(window.dayintChkBxvalue);
      //}
      var filterWhere = "";

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
          for (var m = 0; m < arrayvalues.length; m++) {
            if (m == 0) filterWhere += "(";
            filterWhere += param + " = " + arrayvalues[m];
            if (m !== arrayvalues.length - 1) filterWhere += " OR ";
            else {
              filterWhere += ")";
            }
          }
          counter++;
          overall++;
        } else if (counter > 0 && overall > 0) {
          filterWhere += " AND (";
          for (var m = 0; m < arrayvalues.length; m++) {
            filterWhere += param + " = " + arrayvalues[m];
            if (m !== arrayvalues.length - 1) filterWhere += " OR ";
            if (m == arrayvalues.length - 1) {
              filterWhere += ")";
            }
          }
          counter++;
        }
        if (counter == selected.length) {
          counter = 0;
        }
      }

      this.query = new Query();
      //this.query.orderByFieldsForStatistics = ["LRSROOT"]; // The default orderByField is LRSID
      this.query.where = "1 = 1 ";
      if (this.query.where == "1 = 1 AND ") {
        this.query.where = "1 = 1";
      }

      this.query.returnGeometry = true;

      //define statistic definitions
      //query data set and outfields
      //define logic for the source values
      if (window.srcvalue == "TMC Device") {
        this.queryTask = new QueryTask(
          "https://cadsrgis2.org/arcgis/rest/services/trafdata/trafhr1218/MapServer/0"
        );
        // https://cadsrgis2.org/arcgis/rest/services/trafdata/trafsamp/MapServer/0
        this.query.outFields = ["lrsidnum", "VOLUME"];
        var sqlExpression = "VOLUME";
        this.query.groupByFieldsForStatistics = ["lrsidnum"];
      }
      if (window.srcvalue == "Speeds") {
        this.queryTask = new QueryTask(
          "https://cadsrgis2.org/arcgis/rest/services/trafdata/speed17/MapServer/0"
        );
        // https://cadsrgis2.org/arcgis/rest/services/trafdata/trafsamp/MapServer/0
        this.query.outFields = ["lrsidnum", "SPEED"];
        var sqlExpression = "SPEED";
        this.query.groupByFieldsForStatistics = ["lrsidnum"];
      }
      if (window.srcvalue == "Bluetooth") {
        console.log(window.srcvalue);
        this.queryTask = new QueryTask(
          "https://cadsrgis2.org/arcgis/rest/services/trafdata/bluesep18hr/MapServer/0"
        );
        // https://cadsrgis2.org/arcgis/rest/services/trafdata/trafsamp/MapServer/0
        this.query.outFields = ["lrsidnum", "SPEED"];
        var sqlExpression = "SPEED";
        this.query.groupByFieldsForStatistics = ["lrsidnum"];
      }
      if (window.srcvalue == "DE ATR AADT") {
        console.log(window.srcvalue);
        this.queryTask = new QueryTask(
          "https://cadsrgis2.org/arcgis/rest/services/trafdata/atrvolume11to16/MapServer/0"
        );
        // https://cadsrgis2.org/arcgis/rest/services/trafdata/trafsamp/MapServer/0
        this.query.outFields = ["lrsidnum", "VOLUME"];
        var sqlExpression = "VOLUME";
        this.query.groupByFieldsForStatistics = ["lrsidnum"];
      }
      if (window.srcvalue == "NPMRDS") {
        console.log(window.srcvalue);
        this.queryTask = new QueryTask(
          "https://cadsrgis2.org/arcgis/rest/services/trafdata/nprmrds/MapServer/0"
        );
        // https://cadsrgis2.org/arcgis/rest/services/trafdata/trafsamp/MapServer/0
        this.query.outFields = ["lrsidnum", "SPEED"];
        var sqlExpression = "SPEED";
        this.query.groupByFieldsForStatistics = ["lrsidnum"];
      }

      this.query.groupByFieldsForStatistics = ["lrsidnum"];
      this.query.orderByFieldsForStatistics = ["lrsidnum"];
      if (window.srcvalue == "Bluetooth") {
        // this.query.groupByFieldsForStatistics = ["lrsidnum"];
        this.query.orderByFieldsForStatistics = ["lrsidnum"];
      }
      if (window.srcvalue == "Speeds") {
        this.query.groupByFieldsForStatistics = ["lrsidnum"];
        this.query.orderByFieldsForStatistics = ["lrsidnum"];
      }

      this.query.where = filterWhere;
      window.filtwhere = filterWhere;
      //  this.query.where = sqlExpression+">0";
      console.log(typeof sqlExpression);
      if (typeof sqlExpression === "undefined") {
        this.notifier("No matching SQL Expression found");
        return 0;
      }
      var avgStatDef = new StatisticDefinition();
      avgStatDef.statisticType = "avg";
      avgStatDef.onStatisticField = sqlExpression;
      avgStatDef.outStatisticFieldName = "avg" + sqlExpression;

      this.query.outStatistics = [avgStatDef];
      this.query.where = sqlExpression + ">0" + " AND " + this.query.where;

      alert(this.query.where);

      this.queryTask.execute(this.query, lang.hitch(this, this.vol));
      this.s.innerHTML = "Status: Querying from REST service...";
    },

    saveFilt: function() {
      var _this = this;
      if (this.CurrentFilterf.value == "" && this.TheUserf.value == "") {
        this.notifier("Please select a username and filter name before saving");
        return 0;
      } else if (this.CurrentFilterf.value == "") {
        this.notifier("Please select a filter name before saving");
        return 0;
      } else if (this.sourceDropList.value == "none") {
        this.notifier("Please select a data source before saving");
        return 0;
      }

      window.filtqueryTask = new QueryTask(
        "https://cadsrgis2.org/arcgis/rest/services/trafdata/filters/FeatureServer/0"
      );
      window.filtquery = new Query();
      window.filtquery.returnGeometry = false;
      window.filtquery.where = "1=1";
      window.filtquery.outFields = ["*"];
      if (this.TheUserf.value != "none") {
        var pointLayer = new FeatureLayer(
          "https://cadsrgis2.org/arcgis/rest/services/trafdata/filters/FeatureServer/0",
          {
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"]
          }
        );

        var attr = {
          USERNAME: this.TheUserf.value,
          SELNAME: this.CurrentFilterf.value,
          //"CUSTOMSQL":custsqlInput.value,
          MONCHK: this.monChkBx.checked,
          TUESCHK: this.tuesChkBx.checked,
          WEDCHK: this.wedChkBx.checked,
          THURCHK: this.thurChkBx.checked,
          FRICHK: this.friChkBx.checked,
          SATCHK: this.satChkBx.checked,
          SUNCHK: this.sunChkBx.checked,
          WEEKDAY: this.wkdayChkBx.checked,
          WEEKEND: this.wkendChkBx.checked,
          JANCHK: this.janChkBx.checked,
          FEBCHK: this.febChkBx.checked,
          MARCHK: this.marChkBx.checked,
          APRCHK: this.aprChkBx.checked,
          MAYCHK: this.mayChkBx.checked,
          JUNCHK: this.junChkBx.checked,
          JULCHK: this.julChkBx.checked,
          AUGCHK: this.augChkBx.checked,
          SEPCHK: this.sepChkBx.checked,
          OCTCHK: this.octChkBx.checked,
          NOVCHK: this.novChkBx.checked,
          DECCHK: this.decChkBx.checked,
          HR0: this.h0ChkBx.checked,
          HR1: this.h1ChkBx.checked,
          HR2: this.h2ChkBx.checked,
          HR3: this.h3ChkBx.checked,
          HR4: this.h4ChkBx.checked,
          HR5: this.h5ChkBx.checked,
          HR6: this.h6ChkBx.checked,
          HR7: this.h7ChkBx.checked,
          HR8: this.h8ChkBx.checked,
          HR9: this.h9ChkBx.checked,
          HR10: this.h10ChkBx.checked,
          HR11: this.h11ChkBx.checked,
          HR12: this.h12ChkBx.checked,
          HR13: this.h13ChkBx.checked,
          HR14: this.h14ChkBx.checked,
          HR15: this.h15ChkBx.checked,
          HR16: this.h16ChkBx.checked,
          HR17: this.h17ChkBx.checked,
          HR18: this.h18ChkBx.checked,
          HR19: this.h19ChkBx.checked,
          HR20: this.h20ChkBx.checked,
          HR21: this.h21ChkBx.checked,
          HR22: this.h22ChkBx.checked,
          HR23: this.h23ChkBx.checked,
          // BEGDAY: this.filterBeginDate.getDay() + 1,
          // BEGYEAR: this.filterBeginDate.getFullYear(),
          // ENDMONTH: this.filterEndDate.getMonth() + 1,
          // ENDDAY: this.filterEndDate.getDay() + 1,
          // ENDYEAR: this.filterEndDate.getFullYear(),
          //INT0: this.int0ChkBx.checked,
          //INT5: this.int5ChkBx.checked,
          //INT15: this.int15ChkBx.checked,
          //INTHR: this.hrintChkBx.checked,
          //INTDAY: this.dayintChkBx.checked,
          AGGVAR: this.aggtypeDropList.value,
          AGGBY1: this.byvar1DropList.value,
          AGGBY2: this.byvar2DropList.value,
          // BEGDATE: this.begindatepicker.value,
          // ENDDATE: this.enddatepicker.value,
          ALLYR: this.allyrChkBx.checked,
          SCLYR: this.schChkBx.checked,
          SUMMER: this.sumChkBx.checked,
          Q1: this.frstChkBx.checked,
          Q2: this.secChkBx.checked,
          Q3: this.thrdChkBx.checked,
          Q4: this.frthChkBx.checked,
          ALLDAY: this.alldayChkBx.checked,
          AMPK: this.ampkChkBx.checked,
          MIDDAY: this.midChkBx.checked,
          PMPK: this.pmpkChkBx.checked,
          YR2008: this.yr2008ChkBx.checked,
          YR2009: this.yr2009ChkBx.checked,
          YR2010: this.yr2010ChkBx.checked,
          YR2011: this.yr2011ChkBx.checked,
          YR2012: this.yr2012ChkBx.checked,
          YR2013: this.yr2013ChkBx.checked,
          YR2014: this.yr2014ChkBx.checked,
          YR2015: this.yr2015ChkBx.checked,
          YR2016: this.yr2016ChkBx.checked,
          YR2017: this.yr2017ChkBx.checked,
          DESCRIP: this.descripTextf.value,
          source: this.sourceDropList.value
        };
        console.log(attr);
      }

      var query = new esri.tasks.Query();

      query.outFields = ["*"];
      query.where = "1=1";
      // Query for the features with the given object ID
      console.log(pointLayer);
      alert(window.srcvalue);
      window.filtflag = 0;
      pointLayer.queryFeatures(query, function(featureSet) {
        console.log(featureSet);
        window.features = featureSet.features;
        console.log(window.features);

        console.log(this.filterDropListf[0].selected);

        if (window.filtflag == 0) {
          console.log(this.sourceDropList.value);
          var pt = new esri.geometry.Point(
            -8415982,
            4750944,
            new esri.SpatialReference({
              wkid: 102100
            })
          );

          var addGraphic2 = new esri.Graphic(pt, null, attr, null);
          pointLayer.applyEdits([addGraphic2], null, null, function() {
            window.newfiltname = attr.SELNAME;
            this.filterDropListf.length += 1;
            _this.filtquery.where = "USERNAME = '" + _this.TheUserf.value + "'";
            _this.filtqueryTask.execute(
              _this.filtquery,
              lang.hitch(_this, _this.loadFilters)
            );
          });
          console.log([pointLayer]);
        }
      });
      this.s.innerHTML =
        "Status: Filter has been saved to User: " + _this.TheUserf.value;
    },

    vol: function(results) {
      //this function takes the results from our startup function query and packages them into global arrays
      //these global arrays are then used to store LRSID's and their volume/speed data
      //lrsidarr holds the LRSIDs from the query, and avgvolarr holds those LRSIDs volume data
      this.s.innerHTML = "Status: Retrieving vehicle data from LRSID...";
      console.log("should be in vol now");
      console.log(results.features.length);
      if (results.features.length < 1) {
        this.notifier("No data was found in ${window.currentfilter}");
        return 0;
      }
      window.avgvolarr = [];
      window.lrsidarr = [];

      if (window.srcvalue == "TMC Device") {
        for (var i = 0; i < results.features.length; i++) {
          results.features[i].attributes.avgVOLUME =
            results.features[i].attributes.avgVOLUME | 0;
          window.avgvolarr.push(results.features[i].attributes.avgVOLUME);
          window.lrsidarr.push(results.features[i].attributes.lrsidnum);
        }
        window.rows = [];

        var datanames = [];
        datanames.push("LRSID");
        datanames.push("avgVOLUME");
        datanames.push("numRecords");
        datanames.push("maxVOLUME");
        datanames.push("minVOLUME");
        datanames.push("StdDevVOLUME");
        window.rows.push(datanames);

        for (var step = 0; step < results.features.length; step++) {
          var data = [];
          data.push(results.features[step].attributes.lrsidnum);
          data.push(results.features[step].attributes.avgVOLUME);
          data.push(results.features[step].attributes.numRecords);
          data.push(results.features[step].attributes.maxVOLUME);
          data.push(results.features[step].attributes.minVOLUME);
          data.push(results.features[step].attributes.StdDevVOLUME);
          window.rows.push(data);
        }
      } else if (window.srcvalue == "Speeds") {
        for (var i = 0; i < results.features.length; i++) {
          //results.features[i].attributes.avgSPEED = //Math.round(results.features[i].attributes.avgSPEED * 10) / 10;
          results.features[i].attributes.lrsidnum;
          results.features[i].attributes.avgSPEED =
            results.features[i].attributes.avgSPEED | 0;
          window.avgvolarr.push(results.features[i].attributes.avgSPEED);
          //results.features[i].attributes.LRSID = //results.features[i].attributes.LRSID.slice(0, -1);
          window.lrsidarr.push(results.features[i].attributes.lrsidnum);
        }
        console.log(window.lrsidarr);
      } else if (window.srcvalue == "Bluetooth") {
        for (var i = 0; i < results.features.length; i++) {
          //results.features[i].attributes.avgspeed = Math.round(results.features[i].attributes.avgspeed);
          results.features[i].attributes.avgSPEED =
            results.features[i].attributes.avgSPEED | 0;

          window.avgvolarr.push(results.features[i].attributes.avgSPEED);
          //results.features[i].attributes.LRSID = //results.features[i].attributes.LRSID.slice(0, -1);
          window.lrsidarr.push(results.features[i].attributes.lrsidnum);
        }
        console.log(results.features);

        window.rows = [];

        var datanames = [];
        datanames.push("LRSID");
        datanames.push("avgSPEED");
        datanames.push("numRecords");
        datanames.push("maxspeed");
        datanames.push("minspeed");
        datanames.push("StdDevspeed");
        window.rows.push(datanames);

        for (var step = 0; step < results.features.length; step++) {
          var data = [];
          data.push(results.features[step].attributes.lrsidnum);
          data.push(results.features[step].attributes.avgSPEED);
          data.push(results.features[step].attributes.numRecords);
          data.push(results.features[step].attributes.maxspeed);
          data.push(results.features[step].attributes.minspeed);
          data.push(results.features[step].attributes.StdDevspeed);
          window.rows.push(data);
        }
      } else if (window.srcvalue == "DE ATR AADT") {
        for (var i = 0; i < results.features.length; i++) {
          //results.features[i].attributes.avgSPEED = //Math.round(results.features[i].attributes.avgSPEED * 10) / 10;

          results.features[i].attributes.avgVOLUME =
            results.features[i].attributes.avgVOLUME | 0;
          window.avgvolarr.push(results.features[i].attributes.avgVOLUME);
          //results.features[i].attributes.LRSID = //results.features[i].attributes.LRSID.slice(0, -1);
          window.lrsidarr.push(results.features[i].attributes.lrisdnum);
        }

        window.rows = [];

        var datanames = [];
        datanames.push("LRSID");
        datanames.push("avgVOLUME");
        datanames.push("numRecords");
        datanames.push("maxVOLUME");
        datanames.push("minVOLUME");
        datanames.push("StdDevVOLUME");
        window.rows.push(datanames);

        for (var step = 0; step < results.features.length; step++) {
          var data = [];
          data.push(results.features[step].attributes.lrsidnum);
          data.push(results.features[step].attributes.avgVOLUME);
          data.push(results.features[step].attributes.numRecords);
          data.push(results.features[step].attributes.maxVOLUME);
          data.push(results.features[step].attributes.minVOLUME);
          data.push(results.features[step].attributes.StdDevVOLUME);
          window.rows.push(data);
        }
      } else if (window.srcvalue == "NPMRDS") {
        for (var i = 0; i < results.features.length; i++) {
          //results.features[i].attributes.avgSPEED = //Math.round(results.features[i].attributes.avgSPEED * 10) / 10;

          results.features[i].attributes.avgSPEED =
            results.features[i].attributes.avgSPEED | 0;
          window.avgvolarr.push(results.features[i].attributes.avgSPEED);
          //results.features[i].attributes.LRSID = //results.features[i].attributes.LRSID.slice(0, -1);
          window.lrsidarr.push(results.features[i].attributes.lrsidnum);
        }

        window.rows = [];

        var datanames = [];
        datanames.push("LRSID");
        datanames.push("avgSPEED");
        datanames.push("numRecords");
        datanames.push("maxVOLUME");
        datanames.push("minVOLUME");
        datanames.push("StdDevVOLUME");
        window.rows.push(datanames);

        for (var step = 0; step < results.features.length; step++) {
          var data = [];
          data.push(results.features[step].attributes.lrsidnum);
          data.push(results.features[step].attributes.avgVOLUME);
          data.push(results.features[step].attributes.numRecords);
          data.push(results.features[step].attributes.maxVOLUME);
          data.push(results.features[step].attributes.minVOLUME);
          data.push(results.features[step].attributes.StdDevVOLUME);
          window.rows.push(data);
        }
      }

      this.routequeryTask = new QueryTask(
        "https://cadsrgis2.org/arcgis/rest/services/trafdata/linkgeo/MapServer/0"
      );

      if (this.filtquery.where == null) {
        this.routequery.where = "1=1";
      } else if (this.filtquery.where != null) {
        this.routequery.where = this.filtquery.where;
      }
      this.routequery.where = "thecolor >= 0";
      this.routequery.orderByFieldsForStatistics = ["lrsidnum"];
      this.routequery.outFields = ["OBJECTID", "lrsidnum", "thecolor", "LRSID"];

      this.routequeryTask.execute(
        this.routequery,
        lang.hitch(this, this.queryATT)
      );
    },
    queryATT: function(results) {
      this.s.innerHTML = "Status: Painting vehicle data...";
      this.map.disableMapNavigation();

      this.map.hideZoomSlider();

      //if the map has been painted before(count>0) this removes the previous layer so we can add a new map
      var resultCount = results.features.length;

      //runs through and changes all values to -1, making every road segment start as invisible

      for (var i = 0; i < resultCount; i++) {
        results.features[i].attributes.thecolor = -1;
      }
      var alias = "";

      //this nested for-loop checks both databases for matching LRSIDs
      //then, it enters the avgvolume into "thecolor" attribute where the LRSIDs match

      if (window.srcvalue == "TMC Device") {
        var name = "lrsidnum";

        var searchlength = resultCount - 1;
        ("use strict");
        loop1: for (var j = 0; j < window.lrsidarr.length; j++) {
          var minIndex = 0;
          var maxIndex = searchlength;
          var currentIndex;
          var currentElement;
          var searchElement = window.lrsidarr[j];
          loop2: while (minIndex <= maxIndex) {
            currentIndex = ((minIndex + maxIndex) / 2) | 0;

            currentElement = results.features[currentIndex].attributes.lrsidnum;

            if (currentElement < searchElement) {
              minIndex = currentIndex + 1;
            } else if (currentElement > searchElement) {
              maxIndex = currentIndex - 1;
            } else {
              results.features[currentIndex].attributes.thecolor =
                window.avgvolarr[j];

              break loop2;
            }
          }
        }
      }

      if (window.srcvalue == "Bluetooth") {
        var name = "lrsidnum";
        ("use strict");

        for (var j = 0; j < window.lrsidarr.length; j++) {
          for (k = 0; k < resultCount; k++) {
            if (window.lrsidarr[j] == results.features[k].attributes.lrsidnum) {
              results.features[k].attributes.thecolor = window.avgvolarr[j];
            }
          }
        }
      }
      if (window.srcvalue == "DE ATR AADT") {
        var name = "lrsidnum";
        ("use strict");

        for (var j = 0; j < window.lrsidarr.length; j++) {
          for (k = 0; k < resultCount; k++) {
            if (window.lrsidarr[j] == results.features[k].attributes.lrsidnum) {
              results.features[k].attributes.thecolor = window.avgvolarr[j];
            }
          }
        }
      }
      if (window.srcvalue == "NPMRDS") {
        var name = "lrsidnum";
        ("use strict");

        for (var j = 0; j < window.lrsidarr.length; j++) {
          for (k = 0; k < resultCount; k++) {
            if (window.lrsidarr[j] == results.features[k].attributes.lrsidnum) {
              results.features[k].attributes.thecolor = window.avgvolarr[j];
            }
          }
        }
      }

      if (window.srcvalue == "Speeds") {
        alias = "SPEED";
        var name = "lrsidnum";

        var searchlength = resultCount - 1;
        ("use strict");
        loop1: for (var j = 0; j < window.lrsidarr.length; j++) {
          var minIndex = 0;
          var maxIndex = searchlength;
          var currentIndex;
          var currentElement;
          var searchElement = window.lrsidarr[j];
          loop2: while (minIndex <= maxIndex) {
            currentIndex = ((minIndex + maxIndex) / 2) | 0;

            currentElement = results.features[currentIndex].attributes.lrsidnum;

            if (currentElement < searchElement) {
              minIndex = currentIndex + 1;
            } else if (currentElement > searchElement) {
              maxIndex = currentIndex - 1;
            } else {
              results.features[currentIndex].attributes.thecolor =
                window.avgvolarr[j];

              break loop2;
            }
          }
        }
      }
      //                Array.prototype.remove = function(from, to) {
      //                    var rest = this.slice((to || from) + 1 || this.length);
      //                    this.length = from < 0 ? this.length + from : from;
      //                    return this.push.apply(this, rest);
      //                };

      //this changes the data to display in quantiles

      // remove assignment when using custom classes
      this.quantiles = true;
      if (this.quantiles == true) {
        window.avgvolarr.sort(function(a, b) {
          return a - b;
        });

        var incr = (window.avgvolarr.length / this.classNum.value) | 0;
        var i = 0;
        var count = 0;
        while (count < this.classNum.value) {
          document.getElementById(window.elarr[count]).value =
            window.avgvolarr[i] | 0;
          i += incr;
          count++;
        }
      }

      var featarr = [];
      console.log(results.features);
      for (var j = 0; j < results.features.length; j++) {
        if (results.features[j].attributes.thecolor != -1) {
          featarr.push(results.features[j]);
        } else {
          if (
            (results.features[j].attributes.LRSID[-1] == "L") |
            (results.features[j].attributes.LRSID[-1] == "L")
          ) {
            featarr.push(results.features[j]);
          }
        }
      }

      results.features = featarr;
      console.log(results.features);
      var fields = [
        {
          name: "OBJECTID",
          type: "esriFieldTypeOID",
          alias: "OBJECTID"
        },
        {
          name: name,

          type: "esriFieldTypeDouble",
          alias: "lrsidnum"
        },

        {
          name: "thecolor",
          type: "esriFieldTypeSmallInteger",
          alias: alias
        }
      ];
      var layerDefinition = {
        geometryType: "esriGeometryPolyline",
        fields: fields,
        objectIdField: "OBJECTID"
      };
      var featureCollection = {
        layerDefinition: layerDefinition,
        featureSet: results,
        geommetryType: Polyline
      };
      var layer = new esri.layers.FeatureLayer(featureCollection, {
        id: "data layer",
        mode: esri.layers.FeatureLayer.MODE_SNAPSHOT
      });

      //array holding symbols for each classbreak
      var symbol = new SimpleLineSymbol();
      var symbols = [];
      for (var i = 0; i < 10; i++) {
        var tmp = new SimpleLineSymbol();
        tmp.setMarker({
          style: "arrow",
          placement: "end"
        });
        tmp.setWidth(2);
        symbols.push(tmp);
      }

      //array holding default color values for renderer
      var colorarr = [
        new Color([87, 102, 76, 250]),
        new Color([24, 299, 0, 250]),
        new Color([171, 220, 0, 250]),
        new Color([0, 220, 122, 250]),
        new Color([216, 192, 0, 250]),
        new Color([212, 118, 0, 250]),
        new Color([203, 0, 22, 250]),
        new Color([199, 0, 88, 250]),
        new Color([195, 0, 151, 250])
      ];

      var colory = [new Color([255, 0, 0, 250])];

      var renderer = new ClassBreaksRenderer(symbol, "thecolor", "quantile");

      renderer.addBreak(
        -1,
        0,
        new SimpleLineSymbol().setColor(new Color([56, 168, 0, 0]))
      );

      // Used to determine class break values: VOLUME or SPEED

      if (this.classNum.value == "") {
        this.classNum.value = 7;
        this.classNum.dispatchEvent(new Event("change"));
      }
      //Simple statement to check if classNum value is less than or equal to 5 and change colorarr to scale colors. Maybe easiest solution if any
      //further problems would be to have an if statement for n+2 classNum value.
      console.log(this.classNum.value);
      if (this.classNum.value <= 7) {
        colorarr = [
          new Color([87, 102, 76, 250]),
          new Color([24, 299, 0, 250]),
          new Color([171, 220, 0, 250]),
          new Color([212, 118, 0, 250]),
          new Color([207, 46, 0, 250]),
          new Color([199, 0, 88, 250]),
          new Color([195, 0, 151, 250])
        ];
      }

      var iterstop = this.classNum.value - 1;
      //this forloop adds class breaks to the renderer depending on how many classes the user wants
      for (var i = 0; i < iterstop; i++) {
        renderer.addBreak(
          document.getElementById(window.elarr[i]).value,
          document.getElementById(window.elarr[i + 1]).value,
          symbols[i].setColor(colorarr[i])
        );
      }

      //adds the last break to the renderer
      renderer.addBreak(
        document.getElementById(window.elarr[iterstop]).value,
        Infinity,
        symbols[iterstop].setColor(colorarr[iterstop])
      );

      //adds the renderer to the layer, then adds the layer to the map
      layer.setRenderer(renderer);

      if (window.layerCount) {
        if (this.map.getLayer("data layer"))
          this.map.removeLayer(this.map.getLayer("data layer"));
        if (this.map.getLayer("ltest"))
          this.map.removeLayer(this.map.getLayer("ltest"));
        this.map.addLayer(layer);
      } else {
        this.map.addLayer(layer);
      }

      window.layerCount++;

      this.s.innerHTML = "Status: " + filterDropList.value + " filter loaded";
      this.map.enableMapNavigation();

      this.map.showZoomSlider();
      this.paintLabels(layer);
    },

    paintLabels: function(layer) {
      this.map.graphics.clear();
      console.log(this.map.graphics);

      for (var m = 0; m < layer.graphics.length; m++) {
        var pt;
        pt = layer.graphics[m].geometry.getExtent().getCenter();

        if (layer.graphics[m].attributes.thecolor != -1) {
          var newGraphic = new esri.Graphic(
            pt,
            new esri.symbol.SimpleMarkerSymbol()
              .setColor([255, 255, 255, 100])
              .setOffset(0, 13)
              .setSize("20")
              .setOutline(null)
          );
          this.map.graphics.add(newGraphic);
          var gra = new esri.Graphic(
            pt,
            new esri.symbol.TextSymbol(layer.graphics[m].attributes.thecolor)
              .setOffset(0, 10)
              .setFont(new Font("11pt").setWeight(Font.WEIGHT_BOLD))
          );
          this.map.graphics.add(gra);
          //console.log(this.map);
        }
      }
      // view.on("pointer-move", function(event) {
      //   view.hitTest(event).then(function(response) {
      //     // check if a feature is returned from the hurricanesLayer
      //     // do something with the result graphic
      //     const graphic = response.results.filter(function(result) {
      //       return result.graphic.layer === hurricanesLayer;
      //     })[0].graphic;
      //   });
      // });
      console.log(this.map.layerIds);
    },

    loadRoutes: function(results) {
      var resultCount = results.features.length;

      var ref = dojo.byId("routeDropList");
      ref.options[ref.selectedIndex].text = "none";

      //empty
      var node = document.getElementById("routeDropList");
      while (node.firstChild) node.removeChild(node.firstChild);
      theoption = document.createElement("option");

      if (resultCount > 0) {
        for (var i = 0; i < resultCount; i++) {
          var featureAttributes = results.features[i].attributes;
          theoption.text = featureAttributes["rtname"];
          theoption.value = featureAttributes["rtname"];

          dojo.byId("routeDropList").add(dojo.create("option", theoption));
        }
      } else {
        alert("No routes for this user");
        theoption.text = "none";
        theoption.value = "none";
        dojo.byId("routeDropList").add(dojo.create("option", theoption));
      }
    },

    saveRT: function() {
      if (this.TheUser.value != "" && dojo.byId("routeName").value != "") {
        var pointLayer = new FeatureLayer(
          "https://cadsrgis2.org/arcgis/rest/services/trafdata/trafroutes/FeatureServer/0",
          {
            mode: FeatureLayer.MODE_SNAPSHOT,
            outFields: ["*"]
          }
        );
        var attr = {
          username: this.TheUser.value,
          rtname: this.routeName.value,
          rttext: this.trafficSQL.value //the string
        };
        this.s.innerHTML = "Status: Route saved to user: " + this.TheUser.value;
      } else if (this.TheUser.value == "") {
        this.notifier("Please input a username to save route");
        return;
      } else if (
        this.trafficSQL.value == "" ||
        this.trafficSQL.value == "LRSID in "
      ) {
        this.notifier("Please select a route before saving");
        return;
      }

      var pt = new esri.geometry.Point(
        -8415982,
        4750944,
        new esri.SpatialReference({
          wkid: 102100
        })
      );
      var addGraphic2 = new esri.Graphic(pt, null, attr, null);
      pointLayer.applyEdits([addGraphic2], null, null);
      this.routequery.where = "username = '" + this.TheUser.value + "'";
      this.routequeryTask.execute(
        this.routequery,
        lang.hitch(this, this.loadRoutes)
      );
      console.log(addGraphic2);
    },

    deleteSelRoute: function(results) {
      var resultCount = results.features.length;
      console.log(results);
      if (resultCount > 0) {
        for (var i = 0; i < resultCount; i++) {
          var featureAttributes = results.features[i].attributes;
          console.log(results.features[i].attributes);
          this.theobjectid = featureAttributes["OBJECTID"];
          console.log(this.theobjectid);
          var url =
            "https://cadsrgis2.org/arcgis/rest/services/trafdata/trafroutes/FeatureServer/0/deleteFeatures";
          var requestHandle = esriRequest(
            {
              url: url,
              content: {
                objectIds: this.theobjectid,
                f: "json"
              }
            },
            {
              usePost: true
            }
          );
          requestHandle.then(); // problem is here
        }
        alert(
          "Route selection has been deleted from User: " + this.TheUser.value
        );
      }
    },

    loadRouteData: function(results) {
      if (results.features[0] != undefined && results.features[0] != null) {
        alert("Route loaded");

        var featureAttributes = results.features[0].attributes;
        console.log(results.features[0]);
        window.rttext = featureAttributes["rttext"];
        window.rtname = featureAttributes["rtname"];
        var input = document.getElementById("trafficSQL");
        input.value = window.rttext;
        this.colorQuery.where = window.rttext;
        alert(window.rttext);
        this.colorqueryTask.execute(
          this.colorQuery,
          lang.hitch(this, this.queryResult)
        );
      }
    },

    // Function never used, temporarily omitted
    // hasDataResult: function(results) {
    //   window.lrsiddata = [];
    //   for (var i = 0; i < results.features.length; i++) {
    //     window.lrsiddata.push(results.features[i].attributes.LRSID);
    //   }
    // },

    queryResult: function(results) {
      this.map.graphics.clear();
      var resultFeatures = results.features;
      for (var i = 0; i < resultFeatures.length; i++) {
        results.features["0"].geometry;
        var myLine = {
          geometry: {
            paths: results.features[i].geometry.paths,
            spatialReference: { wkid: 102100 }
          },
          symbol: {
            color: [0, 0, 0, 255],
            width: 2,
            type: "esriSLS",
            style: "esriSLSSolid"
          }
        };
        var gra = new Graphic(myLine);
        this.map.graphics.add(gra);
      }
    },
    exportToCsv: function(filename, rows) {
      var processRow = function(row) {
        var finalVal = "";
        for (var j = 0; j < row.length; j++) {
          var innerValue = row[j] === undefined ? "" : row[j].toString();

          if (row[j] instanceof Date) {
            innerValue = row[j].toLocaleString();
          }
          var result = innerValue.replace(/"/g, '""');
          if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
          if (j > 0) finalVal += ",";
          finalVal += result;
        }
        return finalVal + "\n";
      };

      var csvFile = "";
      console.log(rows);
      for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
      }

      var blob = new Blob([csvFile], { type: "text/csv;charset=utf-8;" });
      if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, filename);
      } else {
        var link = document.createElement("a");
        if (link.download !== undefined) {
          // feature detection
          // Browsers that support HTML5 download attribute
          var url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    }
  });
});
// Function never used, temporarily omitted
//     queryFilter: function(results) {
//       this.map.graphics.clear();
//       var resultFeatures = results.features;
//       for (var i = 0; i < resultFeatures.length; i++) {
//         results.features["0"].geometry;
//         var myLine = {
//           geometry: {
//             paths: results.features[i].geometry.paths,
//             spatialReference: { wkid: 102100 }
//           },
//           symbol: {
//             color: [0, 0, 0, 255],
//             width: 2,
//             type: "esriSLS",
//             style: "esriSLSSolid"
//           }
//         };
//         var gra = new Graphic(myLine);
//         this.map.graphics.add(gra);
//       }
//     }
//   });
// }}};
