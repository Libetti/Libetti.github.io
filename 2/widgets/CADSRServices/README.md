# CADSRServices Widget

A portable Arcgis Webappbuilder widget created using the Arcgis Javascript API. This widget acts as a repository for all services aggregated by the Center for Applied Demography and Survey Research at the University of Delaware. 

## Installation

Please note that this is an in-panel widget. To add it to your ArcGIS Web AppBuilder, add the widget to your \client\stemapp\widgets directory, and add a reference to the widget in the standard stemapp configuration WidgetPool located at \client\stemapp\config.json. 

 

    {
    	"label": "CADSRServices",
    	"uri": "widgets/CADSRServices/Widget"
    }

In web appbuilder, navigate to the widget tab under the configure app menu and choose a position to place the CADSRServices widget.



## Usage
![](http://g.recordit.co/1wlGoCAoIX.gif )

The services are organized by Category, right now we have 9 different types

1. Traffic Measures		
2. Schools
3. Transportation		
4. Projections
5. Demographics		
6. Boundaries
7. Destinations And Accessibility		
8. Emergency Management
9. Other Categories

Each of the categories is populated by the layers listed in ./descriptions.json. The header is exampled below, any input enclosed in angled brackets denotes input.

```javascript
{
  "<Category Name>": {
    "<Layer>": {
      "Source": "<Fleet or NPMRDS or TMC or Bluetooth>",
      "url": "<URL to Map Service>",
      "Description": "<Longer description of the layer>",
      "Name": "<Same as Layer>",
      "Time_Extent": {
        "layer_def": "<True if a map Time Extent is set; False if using Layer Definitions>",
        "day_range": "<range of days surveyed; usually 4 or 7>",
        "dow": "<Name of the attribute storing day of week>",
        "hour": "<Name of the attribute storing hour of day>",
        "year": "Name of the attribute storing the year"
    }
},
```

If the layer is not time-enabled, then leave the Time_Extent fields empty.
The widget builds an ArcGISDynamicMapServiceLayer object depending on the MapServer url read in from the descriptions.json. 
`https://organization.org/arcgis/rest/services/ExampleDBO/MapServer`

```javascript
        window.layer = new esri.layers.ArcGISDynamicMapServiceLayer(
          descriptions.category.layer.url,
          {
            mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
            id: ""
          }
        );
```
The "dow" "hour" and "year" properties reference their related attributes in any published service that is time enabled. 

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)