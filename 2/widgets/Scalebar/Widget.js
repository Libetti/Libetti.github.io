///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/html',
  'dojo/Deferred',
  'jimu/BaseWidget',
  'jimu/utils',
  'jimu/portalUtils',
  'jimu/dijit/Message',
  'esri/dijit/Scalebar',
  'dojo/on',
  "esri/geometry/scaleUtils",
  "dojo/dom-style",
  'dojo/query',
  'dojo/NodeList-dom'
],
  function (declare, lang, html, Deferred, BaseWidget, utils, PortalUtils, Message,
    Scalebar, on, scaleUtils, domStyle, query) {
    var clazz = declare([BaseWidget], {
      baseClass: "jimu-widget-scalebar",
      name: "Scalebar",
      scalebar: null,

      moveTopOnActive: false,

      startup: function () {
        this.inherited(arguments);
        console.log("HEY THERE FOLKS")
        var json = lang.clone(this.config.scalebar);
        json.map = this.map;
        if (this.position) {
          if (this.position.top !== undefined && this.position.left !== undefined) {
            json.attachTo = "top-left";
          } else if (this.position.top !== undefined && this.position.right !== undefined) {
            json.attachTo = "top-right";
          } else if (this.position.bottom !== undefined && this.position.left !== undefined) {
            json.attachTo = "bottom-left";
          } else if (this.position.bottom !== undefined && this.position.right !== undefined) {
            json.attachTo = "bottom-right";
          }
        }

        this._processConfig(json).then(lang.hitch(this, function (scaleJson) {
          if (!scaleJson.scalebarStyle) {
            scaleJson.scalebarStyle = 'line';
          }
          this.scalebar = new Scalebar(scaleJson);
          this.scalebar.show();

          this.domNode.appendChild(this.scalebar.domNode);
          this._hackForhighlight();

          if (scaleJson.scalebarStyle === 'ruler') {
            html.addClass(this.scalebar.domNode, 'ruler-style');
          } else {
            html.removeClass(this.scalebar.domNode, 'ruler-style');
          }

          var style = {
            left: 'auto',
            right: 'auto',
            top: 'auto',
            bottom: 'auto',
            width: 'auto'
          };
          lang.mixin(style, this.position);
          domStyle.set(this.domNode, utils.getPositionStyle(style));

          if (this._isNumberStyle()) {
            this._createNumberStyleContainer();
            this._showNumberScale();//init number style
          }

          this._set508Label();

          setTimeout(lang.hitch(this, function () {
            if (!this.domNode) {
              return;
            }
            domStyle.set(this.domNode, utils.getPositionStyle(style));

            this.own(on(this.map, "extent-change", lang.hitch(this, this.onExtentChange)));
          }), 1000);
        }), lang.hitch(this, function (err) {
          new Message({
            message: err.message || err
          });
        }));
      },

      _processConfig: function (configJson) {
        var def = new Deferred();
        if (this._isNumberStyle()) {
          configJson.scalebarStyle = "line";//hack style for API
        }

        if (configJson.scalebarUnit) {
          def.resolve(configJson);
        } else {
          PortalUtils.getUnits(this.appConfig.portalUrl).then(lang.hitch(this, function (units) {
            configJson.scalebarUnit = units === 'english' ? 'english' : 'metric';
            def.resolve(configJson);
          }));
        }

        return def.promise;
      },

      _hackForhighlight: function () {
        query('.esriScalebar', this.domNode).removeClass('esriScalebar');
      },

      onClose: function () {
        this.scalebar.destroy();
      },

      /* number style */
      _createNumberStyleContainer: function () {
        var styleList = ["top-right", "bottom-right", "top-center",
          "bottom-center", "bottom-left", "top-left"];
        for (var i = 0, len = styleList.length; i < len; i++) {
          var styleStr = ".scalebar_" + styleList[i];
          query(styleStr, this.domNode).addClass('hide');//hide raw dom for ie11
        }

        this.numberStyleContainer = html.create('div', {
          'class': "number-style"
        }, this.domNode);
      },
      _isNumberStyle: function () {
        return ("number" === this.config.scalebar.scalebarStyle);
      },
      onExtentChange: function () {
        this._set508Label();
        this._refreshTooltip();

        if (this._isNumberStyle()) {
          this._showNumberScale();
        }
      },

      _getScaleString: function () {
        var s = scaleUtils.getScale(this.map);
        if (isNaN(s)) {
          s = "";
        } else {
          s = utils.localizeNumberByFieldInfo(s, {
            format: {
              places: this.config.scalebar.decimalPlaces,
              digitSeparator: this.config.scalebar.addSeparator
            }
          });

          s = (window.isRTL ? s + ":1" : "1:" + s);
        }

        return s;
      },
      _showNumberScale: function () {
        this.numberStyleContainer.innerHTML =
          "<div class='scaleLabelDiv scalebar-line'>" + this._getScaleString() + "</div>";
      },
      _set508Label: function (label) {
        var str,
          scale = this._getScaleString();
        if (label) {
          str = label;
        } else if (scale) {
          str = this.nls.scale + " " + scale;
        }

        html.setAttr(this.domNode, 'aria-label', str);
      },
      _refreshTooltip: function () {
        if (utils.isInNavMode() && html.hasClass(document.activeElement, this.baseClass)) {
          this.domNode.blur();
          this.domNode.focus();
        }
      }
    });

    return clazz;
  });