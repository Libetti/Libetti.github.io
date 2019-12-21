///////////////////////////////////////////////////////////////////////////
/*
				CADSRServices Widget
				
University of Delaware - Center for Applied Demography and Survey Research
Authors: David Racca, Anthony Libetti
November 2019
CADSRServices is a portable data aggregation widget that comes prepared with over a dozen MapServer layers 
and functionality to add them to a provided basemap. Supports time enabled layers 
and the addition of (n) # of layers depending on the users' needs. Layer descriptions found at ./descriptions.json.
*/
///////////////////////////////////////////////////////////////////////////
define([
  "dijit/registry",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/layout/BorderContainer",
  "dijit/layout/ContentPane",
  "dijit/TitlePane",
  "dojo/domReady!",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/html",
  "dojo/_base/array",
  "dojo/Deferred",
  "esri/dijit/InfoWindow",
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/_base/json",
  "dojo/on",
  "dojo/query",
  "dijit/registry",
  "esri/arcgis/Portal",
  "esri/Color",
  "esri/config",
  "esri/IdentityManager",
  "esri/InfoTemplate",
  "esri/map",
  "esri/layers/FeatureLayer",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/arcgis/OAuthInfo",
  "esri/request",
  "esri/tasks/IdentifyTask",
  "esri/tasks/IdentifyParameters",
  "esri/IdentityManager",
  "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/TimeExtent",
  "esri/urlUtils",
  "jimu/BaseWidget",
  "jimu/loaderplugins/jquery-loader!https://code.jquery.com/jquery-3.4.1.min.js, https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.bundle.min.js, https://cdn.jsdelivr.net/npm/bootstrap-select@1.13.9/dist/js/bootstrap-select.min.js"
], function (
  registry,
  _WidgetsInTemplateMixin,
  BorderContainer,
  ContentPane,
  TitlePane,
  domReady,
  declare,
  lang,
  html,
  arrayUtils,
  Deferred,
  InfoWindow,
  dom,
  domConstruct,
  dojoJson,
  on,
  query,
  registry,
  arcgisPortal,
  Color,
  config,
  IdentityManager,
  InfoTemplate,
  map,
  Popup,
  ArcGISDynamicMapServiceLayer,
  OAuthInfo,
  esriRequest,
  IdentifyTask,
  IdentifyParameters,
  esriId,
  QueryTask,
  Query,
  TimeExtent,
  urlUtils,
  BaseWidget,
  $
) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget, _WidgetsInTemplateMixin], {
    // Custom widget code goes here

    baseClass: "jimu-widget-CADSRServices",

    //this property is set by the framework when widget is loaded.
    name: "CADSRServices",

    //methods to communication with app container:
    postCreate: function () {
      this.inherited(arguments);
      /*
        Requesting layer descriptions
        Additional descriptions can be added to ./descriptions.json
      */
      IdentityManager.checkSignInStatus("http://www.arcgis.com").then(
        function (results) {
          console.log(results, "signed in");
        },
        function (results) {
          console.log(results, "Not signed in");
        }
      );

      console.log(esriId.findOAuthInfo("https://www.arcgis.com").toJson())

      var infoWindow = new InfoWindow({}, domConstruct.create("div"));
      infoWindow.startup();
      window.map.infoWindow = infoWindow;
      var requestHandle = esriRequest({
        url: "widgets/CADSRServices/descriptions.json"
      });
      Promise.resolve(requestHandle).then(function (result) {
        layerObject = result;
      });
    },

    startup: function () {
      this.inherited(arguments);
      window.map = this.map;
      $(document).ready(function () {
        $(".dropdown").mouseenter(function () {
          $(this)
            .find(".dropdown-menu")
            .show("slow");
        });
        $(".dropdown").mouseleave(function () {
          $(this)
            .find(".dropdown-menu")
            .hide("slow");
        });
        $(function () {
          $(".selectpicker").selectpicker();
        });
        $('[data-toggle="popover"]').popover({ html: true });

        $("#catss").on("change", "li div input[type=checkbox]", function () {
          var $this = $(this);
          let category = $this[0].id;
          if ($this.is(":checked")) {
            // If transportation, then force single selection determined by data-max-options prop
            if (category == "Transportation") {
              var $optgroup = $(
                `<optgroup id="${category}" label="${category}" data-max-options="1">`
              );
            } else {
              var $optgroup = $(
                `<optgroup id="${category}" label="${category}">`
              );
            }
            $.each(Object.keys(window.layerObject[category]), function () {
              $optgroup.append(
                $("<option>")
                  .attr({
                    class: category,
                    value: this,
                    title: this
                  })
                  .text(window.layerObject[category][this].Description)
              );
            });
            $("#CADSRLayerList").append($optgroup);
          } else {
            $(`#CADSRLayerList optgroup[id="${category}"]`).empty();
          }
          $("#CADSRLayerList").selectpicker("refresh");
          $("#CADSRLayerList").selectpicker("toggle");
        });
      });
    },

    onOpen: function () {
      var panel = this.getPanel();
      var pos = panel.position;
      pos.height = 525;
      pos.width = 350;
      panel.setPosition(pos);
      panel.panelManager.normalizePanel(panel);
      $("#CADSRLayerList").on("changed.bs.select", function (
        event,
        clickedIndex,
        isSelected
      ) {
        if (!isSelected) {
          window.map.removeLayer(window.map.getLayer("ltest"));
          console.log("issleceted");
          return false;
        }
        const $node = $(
          event.target.selectedOptions.item(
            event.target.selectedOptions.length - 1
          )
        );
        const selected = $node[0];

        window.obj = layerObject[`${selected.className}`][`${selected.value}`];

        // Limits range of day selection depending on availability
        if (window.obj.Time_Extent.day_range == "4") {
          $("#day option:gt(3)").prop("disabled", true);
        } else {
          $("#day option:gt(3)").prop("disabled", false);
        }

        // Hides #dateSelector if layer is not time enabled
        window.obj.Time_Extent.dow == "" || window.obj.Time_Extent.hour == ""
          ? $("#dateSelector").hide()
          : $("#dateSelector").show();

        window.layer = new ArcGISDynamicMapServiceLayer(window.obj.url, {
          mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
          id: "ltest"
        });

        /*
        Adding layer and setting default time if necessary
         always forces a #dateSelector change event to capture state
        */
        try {
          if (
            event.target.selectedOptions
              .item(event.target.selectedOptions.length - 1)
              .parentNode.hasAttribute("data-max-options")
          ) {
            window.map.removeLayer(window.map.getLayer("ltest"));
            window.map.addLayer(window.layer);
          }
        } catch (e) {
          console.log(e, "@addlayer");
          window.map.addLayer(window.layer);
        } finally {
          if (!$("#day").val() || !$("#hour").val()) {
            $("#hour").val(12);
            $("#day").val("01");
            $("#year").val(window.obj.Time_Extent.year);
          }
          on.emit(dojo.byId("dateSelector"), "change", {});
        }
        console.log(window.map.getLayer("ltest"));
        window.map.getLayer("ltest").on("load", function () {
          window.map.on("click", function (e) {
            identifyTask = new IdentifyTask(window.obj.url);
            identifyParams = new IdentifyParameters();
            identifyParams.tolerance = 2;
            identifyParams.returnGeometry = true;
            identifyParams.layerIds = 0;
            identifyParams.layerOption =
              IdentifyParameters.LAYER_OPTION_VISIBLE;
            identifyParams.width = window.map.width;
            identifyParams.height = window.map.height;
            identifyParams.geometry = e.mapPoint;
            identifyParams.mapExtent = window.map.extent;
            identifyParams.timeExtent = window.map.timeExtent;
            try {
              identifyTask.execute(identifyParams, function (idResults) {
                const isKey = key =>
                  key.includes("LRSID") || key.includes("Code");
                const lrsidKey = Object.keys(idResults[0].feature.attributes)[
                  Object.getOwnPropertyNames(
                    idResults[0].feature.attributes
                  ).findIndex(isKey)
                ];
                console.log(idResults);
                window.map.infoWindow.setTitle("Road Segment");
                if (
                  window.obj.Time_Extent.dow == "" ||
                  window.obj.Time_Extent.hour == ""
                ) {
                  var content =
                    `<b>Layer Name</b>: ${idResults[0].layerName}` +
                    `<br><b>LRSID</b>: ${idResults[0].feature.attributes[lrsidKey]}` +
                    `<br><b>Source</b>: ${window.obj.Source}` +
                    `<br><b>Date Information</b> Typical ${$(
                      "#day option:selected"
                    ).text()} at ${$("#hour").val()}:00:00`;
                } else {
                  var content =
                    `<b>Layer Name</b>: ${idResults[0].layerName}` +
                    `<br><b>LRSID</b>: ${idResults[0].feature.attributes[lrsidKey]}` +
                    `<br><b>Source</b>: ${window.obj.Source}` +
                    `<br><b>Timevar</b>: ${idResults[0].feature.attributes.timevar}` +
                    `<br><b>Date Information</b> Typical ${$(
                      "#day option:selected"
                    ).text()} at ${$("#hour").val()}:00:00`;
                }
                window.map.infoWindow.setContent(content);
                window.map.infoWindow.show(
                  e.mapPoint,
                  InfoWindow.ANCHOR_UPPERRIGHT
                );
              });
            } catch (err) {
              console.log(err);
              window.map.infoWindow.setContent(
                `<b>No feature selected, please select a polyline</b>`
              );
            }
          });
        });
      });

      //When change in time reference is detected, this handler determines whether to update layer definitions or time extent
      // Builds time information based on day and hour values provided by user
      $("#dateSelector").on("change", function (evt) {
        let day = $("#day").val();
        let hour = $("#hour").val();
        if (window.obj) {
          // Sets layer definitions if specified in ./descriptions.json
          if (window.obj.Time_Extent.layer_def == "true") {
            if (day > window.obj.Time_Extent.day_range) {
              day = "04";
            }
            let layerDef = `"${window.obj.Time_Extent.dow}"=${+day} AND "${
              window.obj.Time_Extent.hour
              }"=${hour}`;
            let layerDefs = [];
            layerDefs[0] = layerDef;
            window.layer.setLayerDefinitions(layerDefs);
          } else {
            // Sets TimeExtent of map if specified in ./descriptions.json
            if (day > window.obj.Time_Extent.day_range) {
              day = "04";
            }
            let timeExtent = new TimeExtent(
              new Date(
                `${window.obj.Time_Extent.year}-09-${day}T${hour.padStart(
                  2,
                  "0"
                )}:00:00`
              ),
              new Date(
                `${window.obj.Time_Extent.year}-09-${day}T${hour.padStart(
                  2,
                  "0"
                )}:00:00`
              )
            );
            window.map.setTimeExtent(timeExtent);
          }
        }
      });

      /* 
        Capture url params, right now accepts entire MapServer url as ?x=<url>
        Idea is to add layer and open widget for date manipulation using only the link
     
      **NOTE** Needs widget to be opened first, defeats purpose of immediately adding layer
          To fix, capture url params from index.js (application level) and open widget programatically to allow time changes
          Problem with this is that it curbs widget portability, although that wouldnt be a problem in hub....
      */
      console.log(window.location.href);
      function getUrlVars() {
        const vars = {};
        const parts = window.location.href.replace(
          /[?&]+([^=&]+)=([^&]*)/gi,
          function (m, key, value) {
            vars[key] = value;
          }
        );
        return vars;
      }
      var x = getUrlVars()["x"];
      if (x) {
        console.log("windowrwad");
        window.layer.url = x;
        $("#CADSRLayerList").trigger("changed.bs.select");
      }
      console.log(x);
      // let layer = new esri.layers.ArcGISDynamicMapServiceLayer(
      //   x,
      //   {
      //     mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
      //     id: "ltest"
      //   }
      // );
      // window.map.addLayer(layer)
    }
  });
});
