"use strict";

/**
 * Map class of the BDQueimadas.
 * @class Map
 *
 * @author Jean Souza [jean.souza@funcate.org.br]
 *
 * @property {array} memberLayers - Layers currently present in the map.
 * @property {array} memberNotAddedLayers - Layers not present in the map.
 * @property {array} memberVisibleLayers - Currently visible layers.
 */
define(
  ['components/Utils', 'TerraMA2WebComponents'],
  function(Utils, TerraMA2WebComponents) {

    // Layers currently present in the map
    var memberLayers = [];
    // Layers not present in the map
    var memberNotAddedLayers = [];
    // Currently visible layers
    var memberVisibleLayers = [];

    /**
     * Returns the array of layers currently present in the map.
     * @returns {array} memberLayers - Layers currently present in the map
     *
     * @function getLayers
     * @memberof Map
     * @inner
     */
    var getLayers = function() {
      return JSON.parse(JSON.stringify(memberLayers));
    };

    /**
     * Returns the array of layers not present in the map.
     * @returns {array} memberNotAddedLayers - Layers not present in the map
     *
     * @function getNotAddedLayers
     * @memberof Map
     * @inner
     */
    var getNotAddedLayers = function() {
      return memberNotAddedLayers;
    };

    /**
     * Returns the instance of ol map
     * @returns {object} map
     * 
     * @function getMap
     * @memberof Map
     * @inner
     */
    var getMap = function() {
      return TerraMA2WebComponents.MapDisplay.getMap();
    };

    /**
     * Adds a layer to the visible layers array.
     * @param {string} layerId - Layer id
     * @param {string} layerName - Layer name
     * @param {string} layerTitle - Layer title
     * @param {string} parentId - Parent id
     * @param {string} parentName - Parent name
     * @param {string} elementId - Html element id
     *
     * @function addVisibleLayer
     * @memberof Map
     * @inner
     */
    var addVisibleLayer = function(layerId, layerName, layerTitle, parentId, parentName, elementId) {
      memberVisibleLayers.push({
        layerId: layerId,
        layerName: layerName,
        layerTitle: layerTitle,
        parentId: parentId,
        parentName: parentName,
        elementId: elementId
      });

      $.event.trigger({type: "updateMapInformationsBox"});
    };

    /**
     * Removes a layer from the visible layers array.
     * @param {string} layerId - Layer id
     *
     * @function removeVisibleLayer
     * @memberof Map
     * @inner
     */
    var removeVisibleLayer = function(layerId) {
      for(var i = 0, count = memberVisibleLayers.length; i < count; i++) {
        if(memberVisibleLayers[i].layerId === layerId) {
          memberVisibleLayers.splice(i, 1);
          break;
        }
      }

      $.event.trigger({type: "updateMapInformationsBox"});
    };

    /**
     * Returns the array of currently visible layers.
     * @returns {array} memberVisibleLayers - Currently visible layers
     *
     * @function getVisibleLayers
     * @memberof Map
     * @inner
     */
    var getVisibleLayers = function() {
      return memberVisibleLayers;
    };

    /**
     * Adds the layers from the map configuration file to the map.
     *
     * @private
     * @function addLayersToMap
     * @memberof Map
     * @inner
     */
    var addLayersToMap = function() {
      var configuration = Utils.getConfigurations().mapConfigurations;

      var layersLength = configuration.Layers.length;

      if(layersLength > 0) {
        for(var i = layersLength - 1; i >= 0; i--) {
          processLayer(configuration.Layers[i], 'terrama2-layerexplorer', 'Camadas Principais');
        }
      }

      $('.children:empty').parent().hide();
    };

    /**
     * Recursive function that processes a given layer or layer group.
     * @param {object} layer - Object with the layer data
     * @param {string} parentId - Parent id
     * @param {string} parentName - Parent name
     *
     * @private
     * @function processLayer
     * @memberof Map
     * @inner
     */
    var processLayer = function(layer, parentId, parentName) {
      var configuration = Utils.getConfigurations().mapConfigurations;

      if(layer.LayerGroup) {
        if(configuration.UseLayerGroupsInTheLayerExplorer) {
          if(TerraMA2WebComponents.MapDisplay.addLayerGroup(layer.Id, layer.Name, parentId) && !layer.DontAddToLayerExplorer)
            TerraMA2WebComponents.LayerExplorer.addLayersFromMap(layer.Id, parentId, null, (layer.Params !== undefined ? layer.Params.Classes : null), (layer.Params !== undefined ? layer.Params.Style : null));
        }

        for(var j = layer.Layers.length - 1; j >= 0; j--) {
          if(configuration.UseLayerGroupsInTheLayerExplorer) {
            processLayer(layer.Layers[j], layer.Id, layer.Name);
          } else {
            processLayer(layer.Layers[j], parentId, parentName);
          }
        }
      } else {
        layer["LayerGroup"] = {
          "Id": parentId,
          "Name": parentName
        };

        if(layer.AddsInTheStart) addLayerToMap(layer, parentId, true);
        else addNotAddedLayer(layer);
      }
    };

    /**
     * Adds a given layer to the Map and to the LayerExplorer.
     * @param {object} layer - Object with the layer data
     * @param {string} parent - Parent id
     *
     * @function addLayerToMap
     * @memberof Map
     * @inner
     */
    var addLayerToMap = function(layer, parent, initialProcess) {
      memberLayers.push(layer);

      var layerName = Utils.processStringWithDatePattern(layer.Name);
      var layerTitle = Utils.processStringWithDatePattern(layer.Title);
      var layerTime = Utils.processStringWithDatePattern(layer.Params.Time);

      var classes = layer.Params !== undefined ? layer.Params.Classes : null;
      var style = layer.Params !== undefined ? layer.Params.Style : null;

      if(layer.Params.TerraMA2WebComponentsFunction !== undefined && layer.Params.TerraMA2WebComponentsFunction !== null) {

        if(layer.Params.TerraMA2WebComponentsFunction === "addBingMapsLayer") {
          var params = {
            minResolution: layer.Params.MinResolution,
            maxResolution: layer.Params.MaxResolution
          };

          if(TerraMA2WebComponents.MapDisplay[layer.Params.TerraMA2WebComponentsFunction](layer.Id, layerName, layerTitle, layer.Visible, layer.Disabled, layer.Params.ImagerySet, layer.Params.BingMapsKey, parent, layer.AppendAtTheEnd, params) && !layer.DontAddToLayerExplorer)
            TerraMA2WebComponents.LayerExplorer.addLayersFromMap(layer.Id, parent, layer.AppendAtTheEnd, classes, style);
        } else {
          if(TerraMA2WebComponents.MapDisplay[layer.Params.TerraMA2WebComponentsFunction](layer.Id, layerName, layerTitle, layer.Visible, parent, layer.AppendAtTheEnd) && !layer.DontAddToLayerExplorer)
            TerraMA2WebComponents.LayerExplorer.addLayersFromMap(layer.Id, parent, layer.AppendAtTheEnd, classes, style);
        }
      } else if(layer.Wmts) {
        var params = {
          minResolution: layer.Params.MinResolution,
          maxResolution: layer.Params.MaxResolution
        };

        if(TerraMA2WebComponents.MapDisplay.addWMTSLayer(layer.Id, layerName, layerTitle, layer.Params.Url, layer.Visible, layer.Disabled, layerTime, layer.Params.Format, layer.Params.MatrixSet, layer.Params.TileGrid, parent, params) && !layer.DontAddToLayerExplorer)
          TerraMA2WebComponents.LayerExplorer.addLayersFromMap(layer.Id, parent, null, classes, style);
      } else {
        var sourceParams = {};

        if(layerTime !== undefined && layer.Params !== undefined && layer.Params.TimeYear !== undefined && layer.Params.TimeMonth !== undefined && layer.Params.TimeDay !== undefined) {
          var layerTimeDate = Utils.stringToDate(layerTime, 'YYYY-MM-DD');

          sourceParams[layer.Params.TimeYear] = layerTimeDate.getFullYear().toString();
          sourceParams[layer.Params.TimeMonth] = ('0' + (layerTimeDate.getMonth() + 1)).slice(-2);
          sourceParams[layer.Params.TimeDay] = ('0' + layerTimeDate.getDate()).slice(-2);
        }

        if(layer.Params !== undefined && layer.Params.Styles !== undefined)
          sourceParams['STYLES'] = layer.Params.Styles;

        var params = {
          minResolution: layer.Params.MinResolution,
          maxResolution: layer.Params.MaxResolution,
          time: layerTime,
          buffer: layer.Params.Buffer,
          version: layer.Params.Version,
          format: layer.Params.Format,
          tileGrid: layer.Params.TileGrid,
          sourceParams: sourceParams
        };

        if(TerraMA2WebComponents.MapDisplay.addTileWMSLayer(layer.Id, layerName, layerTitle, layer.Params.Url, layer.Params.ServerType, layer.Visible, layer.Disabled, parent, params) && !layer.DontAddToLayerExplorer)
          TerraMA2WebComponents.LayerExplorer.addLayersFromMap(layer.Id, parent, null, classes, style);
      }

      if(!initialProcess) {
        $.event.trigger({type: "applyFilter"});

        for(var i = 0, memberNotAddedLayersLength = memberNotAddedLayers.length; i < memberNotAddedLayersLength; i++) {
          if(memberNotAddedLayers[i].Id === layer.Id) {
            memberNotAddedLayers.splice(i, 1);
            return false;
          }
        }
      }

      if(Utils.getConfigurations().mapConfigurations.EnableAddAndRemoveLayers)
        $(".layer:not(:has(.remove-layer))").append("<i class=\"fa fa-fw fa-remove remove-layer\"></i>");

      if(layer.Visible) {
        var parents = $("#" + layer.Id.replace(':', '')).parents('.parent_li').find(' > .group-name > span'),
            parentsLength = parents.length,
            parentsString = "";

        if(parentsLength > 0) {
          for(var i = 0; i < parentsLength; i++) {
            parentsString += parents[i].innerText + " > ";
          }
        }

        addVisibleLayer(layer.Id, layerName, layerTitle, parent, parentsString, layer.Id.replace(':', ''));
      }
    };

    /**
     * 
     * @param {*} result 
     */
    var proxyRes = function(result) {
      if(result.requestId === 'GetFeatureInfoTool') {
        var featureInfo = result.msg;

        var featuresLength = featureInfo.features.length;

        if(featuresLength > 0) {
          var firesAttributes = "";
          btn_collapse = "<div class='box-tools pull-right'><button type='button' class='btn btn-box-tool collapse-btn' data-widget='collapse'>+</button></div>"

          for(var i = 0; i < featuresLength; i++) {

            firesAttributes += "<div class='box box-default'>"
            firesAttributes += "  <div class='box-header'>"
            firesAttributes += "    <div class='box-title'>"
            firesAttributes += "      <strong>Id:</strong> " + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.IdFieldName];
            firesAttributes += "    </div>"
            firesAttributes += btn_collapse
            firesAttributes += "  </div>"
            firesAttributes += "  <div class='box-body'>"
            firesAttributes += "<strong>Latitude:</strong> " + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.LatitudeFieldName] + ' - ' + Utils.convertLatitudeToDMS(featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.LatitudeFieldName]);
            firesAttributes += "<br/><strong>Longitude:</strong> " + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.LongitudeFieldName] + ' - ' + Utils.convertLongitudeToDMS(featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.LongitudeFieldName]);
            firesAttributes += "<br/><strong>Data / Hora:</strong> " + Utils.dateTimeToString(Utils.stringToDateTime(featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.DateTimeFieldName].toString().replace('T', ' ').replace('Z', ''), Utils.getConfigurations().filterConfigurations.LayerToFilter.DateTimeFormat), "YYYY/MM/DD HH:II:SS");
            firesAttributes += "<br/><strong>Satélite:</strong> " + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.SatelliteFieldName];
            firesAttributes += "<br/><strong>Município:</strong> " + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.CityNameFieldName];
            firesAttributes += "<br/><strong>Estado / País:</strong> " + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.StateNameFieldName] + ' / ' + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.CountryNameFieldName];
            firesAttributes += "<br/><strong>Precipitação 24h:</strong> " + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.PrecipitationFieldName];
            firesAttributes += "<br/><strong>Nº dias sem precipitação:</strong> " + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.NumberOfDaysWithoutPrecipitationFieldName];
            firesAttributes += "<br/><strong>Risco Fogo / Bioma:</strong> " + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.RiskFieldName] + ' / ' + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.BiomeFieldName];
            firesAttributes += "<br/><br/><a target='_blank' href='http://maps.google.com.br/maps?q=" + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.LatitudeFieldName] + "," + featureInfo.features[i].properties[Utils.getConfigurations().filterConfigurations.LayerToFilter.LongitudeFieldName] + "&hl=pt-BR&t=h&z=10'>Veja esse ponto no Google Maps</a>";
            firesAttributes += "  </div>"
            firesAttributes += "</div>"
          }

          $('#feature-info-box').html(firesAttributes);

          $('#feature-info-box').dialog({
            dialogClass: "feature-info-box",
            title: (featuresLength > 1 ? "Atributos dos focos" : "Atributos do foco"),
            width: 300,
            height: 380,
            modal: false,
            resizable: true,
            draggable: true,
            closeOnEscape: true,
            closeText: "",
            position: { my: 'top', at: 'top+15' }
          });
        }
      }
    }

    /**
     * Removes a layer with a given id from the Map.
     * @param {string} layerId - Layer id
     *
     * @function removeLayerFromMap
     * @memberof Map
     * @inner
     */
    var removeLayerFromMap = function(layerId) {
      var layerToRemove = null;

      for(var i = 0, memberLayersLength = memberLayers.length; i < memberLayersLength; i++) {
        if(layerId === memberLayers[i].Id) {
          layerToRemove = memberLayers.splice(i, 1);
          return false;
        }
      }

      if(layerToRemove !== null) {
        addNotAddedLayer(layerToRemove[0]);

        if(Utils.getConfigurations().mapConfigurations.UseLayerGroupsInTheLayerExplorer) {
          TerraMA2WebComponents.LayerExplorer.removeLayer(layerToRemove[0].Id, layerToRemove[0].LayerGroup.Id);
        } else {
          TerraMA2WebComponents.LayerExplorer.removeLayer(layerToRemove[0].Id);
        }

        removeVisibleLayer(layerToRemove[0].Id);
      }
    };

    /**
     * Adds a given layer to the array of layers not present in the map.
     * @param {object} layer - Layer
     *
     * @private
     * @function addNotAddedLayer
     * @memberof Map
     * @inner
     */
    var addNotAddedLayer = function(layer) {
      memberNotAddedLayers.push(layer);
    };

    /**
     * Sets the visibility of the background layers when the user set a layer visible.
     * @param {string} selectedLayerId - Id of the selected layer
     *
     * @function setBackgroundsVisibility
     * @memberof Map
     * @inner
     */
    var setBackgroundsVisibility = function(selectedLayerId) {
      var layersLength = memberLayers.length,
          backgroundLayers = [],
          isThisABackgroundLayer = false;

      for(var i = 0; i < layersLength; i++) {
        if(memberLayers[i].Background) {
          if(memberLayers[i].Id === selectedLayerId) {
            isThisABackgroundLayer = true;
          } else {
            backgroundLayers.push(memberLayers[i].Id);
          }
        }
      }

      if(isThisABackgroundLayer) {
        var backgroundLayersLength = backgroundLayers.length;

        for(var i = 0; i < backgroundLayersLength; i++) {
          if($('#' + backgroundLayers[i].replace(':', '') + ' > input').is(":checked")) {
            TerraMA2WebComponents.MapDisplay.setLayerVisibilityById(backgroundLayers[i], false);
            $('#' + backgroundLayers[i].replace(':', '') + ' > input').attr('checked', false);
            removeVisibleLayer(backgroundLayers[i]);
          }
        }
      }
    };

    /**
     * Resets the map tools to its initial state.
     *
     * @function resetMapMouseTools
     * @memberof Map
     * @inner
     */
    var resetMapMouseTools = function() {
      TerraMA2WebComponents.MapDisplay.unsetMapSingleClickEvent();
      TerraMA2WebComponents.MapDisplay.removeZoomDragBox();
      $('.mouse-function-btn').removeClass('active');
      $('#terrama2-map').removeClass('cursor-crosshair');
      $('#terrama2-map').removeClass('cursor-move');
      $('#terrama2-map').removeClass('cursor-pointer');
    };

    /**
     * Activates the move map tool.
     *
     * @function activateMoveMapTool
     * @memberof Map
     * @inner
     */
    var activateMoveMapTool = function() {
      $('#moveMap').addClass('active');
      $('#terrama2-map').addClass('cursor-move');
    };

    /**
     * Sets the map to its initial extent.
     * @param {boolean} applyFilter - Flag that indicates if the filter should be applied
     *
     * @function initialExtent
     * @memberof Map
     * @inner
     */
    var initialExtent = function(applyFilter) {
      TerraMA2WebComponents.MapDisplay.zoomToExtent(Utils.getConfigurations().applicationConfigurations.ContinentExtent);

      if(applyFilter) {
        $.event.trigger({type: "applyFilter"});
        $.event.trigger({type: "updateComponents"});
      }
    };

    /**
     * Activates the Zoom DragBox.
     *
     * @function activateDragboxTool
     * @memberof Map
     * @inner
     */
    var activateDragboxTool = function() {
      $('#dragbox').addClass('active');
      $('#terrama2-map').addClass('cursor-crosshair');
      TerraMA2WebComponents.MapDisplay.addZoomDragBox();
    };

    /**
     * Activates the GetFeatureInfo tool.
     *
     * @function activateGetFeatureInfoTool
     * @memberof Map
     * @inner
     */
    var activateGetFeatureInfoTool = function() {
      $('#getAttributes').addClass('active');
      $('#terrama2-map').addClass('cursor-pointer');

      TerraMA2WebComponents.MapDisplay.setGetFeatureInfoUrlOnClick(Utils.getConfigurations().filterConfigurations.LayerToFilter.LayerId, function(url) {
        if(url !== null) {
          url += "&FEATURE_COUNT=30"

          $.ajax({
            url: Utils.getBaseUrl() + "proxy",
            type: "GET",
            data: { url: url, requestId: 'GetFeatureInfoTool', format: 'json' },
            success: function(result) {
              proxyRes(result);
            }
          });
        }
      });
    };

    /**
     * Adds the layers subtitles from the map configuration file to the map.
     *
     * @private
     * @function addSubtitles
     * @memberof Map
     * @inner
     */
    var addSubtitles = function() {
      var elem = "";
      var configuration = Utils.getConfigurations().mapConfigurations;

      for(var i = 0, subtitlesLength = configuration.Subtitles.length; i < subtitlesLength; i++) {
        elem += "<li id=\"" + configuration.Subtitles[i].Id + "\"><ul class=\"nav nav-pills nav-stacked\"><li><a><span style=\"font-weight: bold; margin-left: 3px;\">" + configuration.Subtitles[i].LayerName + "</span></a></li>";

        var index = configuration.Subtitles[i].LayerId.indexOf(Utils.getConfigurations().filterConfigurations.LayerToFilter.LayerId);
        var liStyle = index > -1 ? "display: none;" : "";

        for(var j = 0, layerSubtitleItemsLength = configuration.Subtitles[i].Subtitles.length; j < layerSubtitleItemsLength; j++) {
          var css = "";

          if(configuration.Subtitles[i].Subtitles[j].FillColor !== null)
            css += "background-color: " + configuration.Subtitles[i].Subtitles[j].FillColor + ";";

          if(configuration.Subtitles[i].Subtitles[j].BorderColor !== null)
            css += "border: solid 2px " + configuration.Subtitles[i].Subtitles[j].BorderColor + ";";

          if(configuration.Subtitles[i].Subtitles[j].Image !== null)
            css += "background: url(" + Utils.getBaseUrl() + configuration.Subtitles[i].Subtitles[j].Image + ");background-size: 12px;background-position: center;background-repeat: no-repeat;";

          elem += "<li class=\"subtitle-item";

          if(index > -1)
            elem += " satellite-subtitle-item";

          elem += "\"";

          if(configuration.Subtitles[i].Subtitles[j].SubtitleId !== null)
            elem += " id=\"" + configuration.Subtitles[i].Subtitles[j].SubtitleId + "\"";

          elem += " style=\"" + liStyle + "\"><a><div style=\"" + css + "\"></div><span>" + configuration.Subtitles[i].Subtitles[j].SubtitleText + "</span></a></li>";
        }

        elem += "</ul></li>";
      }

      $('#map-subtitle-items').append(elem);

      setSubtitlesVisibility();
      updateZoomTop(false);
    };

    /**
     * Calls the socket method that returns the list of satellites for the subtitles.
     * @param {array} satellites - Satellites filter
     * @param {array} biomes - Biomes filter
     * @param {array} countriesIds - Countries filter
     * @param {array} statesIds - States filter
     *
     * @function getSubtitlesSatellites
     * @memberof Map
     * @inner
     */
    var getSubtitlesSatellites = function(satellites, biomes, countriesIds, statesIds) {
      var dates = Utils.getFilterDates(true, true, true, 0);

      if(dates !== null) {
        var dateFrom = Utils.stringToDate(dates[0], 'YYYY/MM/DD');
        var dateTo = Utils.stringToDate(dates[1], 'YYYY/MM/DD');

        var allSatellites = Utils.getConfigurations().filterConfigurations.Satellites.filter(function(e) { 
          var satelliteBegin = Utils.getCurrentDate(true);
          var satelliteEnd = Utils.getCurrentDate(true);
  
          if(e.Begin !== "") {
            var satelliteBeginArray = e.Begin.split('-');
            satelliteBegin = new Date(parseInt(satelliteBeginArray[0]), parseInt(satelliteBeginArray[1]) - 1, parseInt(satelliteBeginArray[2]), 0, 0, 0);
          }
  
          if(e.End !== "") {
            var satelliteEndArray = e.End.split('-');
            satelliteEnd = new Date(parseInt(satelliteEndArray[0]), parseInt(satelliteEndArray[1]) - 1, parseInt(satelliteEndArray[2]), 0, 0, 0);
          }
  
          return ((dateFrom <= satelliteBegin && dateTo >= satelliteEnd) ||
            (dateFrom >= satelliteBegin && dateTo <= satelliteEnd) ||
            (dateFrom <= satelliteBegin && dateTo >= satelliteBegin) ||
            (dateFrom <= satelliteEnd && dateTo >= satelliteEnd));
        }).map(function(e) {
          return {"satelite": e.Id};
        }).sort(function(a, b) {
          if(a.satelite < b.satelite) { return -1; }
          if(a.satelite > b.satelite) { return 1; }
          return 0; 
        });

        updateSubtitles(allSatellites);
      }
    };

    /**
     * Updates the subtitles.
     * @param {array} satellites - Satellites list
     *
     * @function updateSubtitles
     * @memberof Map
     * @inner
     */
    var updateSubtitles = function(satellites) {
      $(".satellite-subtitle-item").hide();

      var satellitesLength = satellites.length;

      if(satellitesLength > 0) {
        $('.satellite-subtitle-item').parent().parent().show();

        for(var i = 0; i < satellitesLength; i++) {
          $("#" + satellites[i].satelite).show();
        }

        $('#no-subtitles').hide();
      } else {
        $('.satellite-subtitle-item').parent().parent().hide();

        if($('#map-subtitle-items').children(':visible').length == 0) {
          $('#no-subtitles').show();
        } else {
          $('#no-subtitles').hide();
        }
      }

      updateZoomTop(false);
    };

    /**
     * Sets the visibility of the subtitles, accordingly with its respective layers. If a layer id is passed, the function is executed only for the subtitles of this layer.
     * @param {string} [layerId] - Layer id
     *
     * @function setSubtitlesVisibility
     * @memberof Map
     * @inner
     */
    var setSubtitlesVisibility = function(layerId) {
      var configuration = Utils.getConfigurations().mapConfigurations;
      var hasVisibleLegend = false;

      for(var i = 0, subtitlesLength = configuration.Subtitles.length; i < subtitlesLength; i++) {
        var layersIds = configuration.Subtitles[i].LayerId.split('|');

        for(var j = 0, layersIdsLength = layersIds.length; j < layersIdsLength; j++) {
          if(layerId === undefined || layerId === layersIds[j]) {
            if(TerraMA2WebComponents.MapDisplay.isCurrentResolutionValidForLayer(layersIds[j]) && TerraMA2WebComponents.MapDisplay.isLayerVisible(layersIds[j])) {
              showSubtitle(configuration.Subtitles[i].Id);
              break;
            } else {
              hideSubtitle(configuration.Subtitles[i].Id);
            }
          }
        }
      }

      var legendItems = $("#map-subtitle-items > li");

      if(legendItems && typeof legendItems === "object" && legendItems.length > 0) {
        for(var i = 0, legendItemsLength = legendItems.length; i < legendItemsLength; i++) {
          if(legendItems[i].id !== "no-subtitles") {
            if(legendItems[i].style.display !== "none") {
              hasVisibleLegend = true;
              return;
            }
          }
        }
      }

      if(!hasVisibleLegend) {
        $('#no-subtitles').show();
      } else {
        $('#no-subtitles').hide();
      }
    };

    /**
     * Shows the subtitles with the given id.
     * @param {string} subtitlesId - Subtitles id
     *
     * @private
     * @function showSubtitle
     * @memberof Map
     * @inner
     */
    var showSubtitle = function(subtitlesId) {
      $("#" + subtitlesId).show();
      updateZoomTop(false);
    };

    /**
     * Hides the subtitles with the given id.
     * @param {string} subtitlesId - Subtitles id
     *
     * @private
     * @function hideSubtitle
     * @memberof Map
     * @inner
     */
    var hideSubtitle = function(subtitlesId) {
      $("#" + subtitlesId).hide();
      updateZoomTop(false);
    };

    /**
     * Updates the zoom element top.
     * @param {boolean} toggle - Flag that indicates if the subtitle toggle was triggered
     *
     * @function updateZoomTop
     * @memberof Map
     * @inner
     */
    var updateZoomTop = function(toggle) {
      if(toggle) {
        setTimeout(function() {
          $('#terrama2-map .ol-zoom').animate({ 'top': ($('#map-subtitle').height() + 7) + 'px' }, { duration: 300, queue: false });
          $('#map-tools').animate({ 'top': ($('#map-subtitle').height() + 79) + 'px' }, { duration: 300, queue: false });
        }, 500);
      } else {
        $('#terrama2-map .ol-zoom').css('top', ($('#map-subtitle').height() + 7) + 'px');
        $('#map-tools').css('top', ($('#map-subtitle').height() + 79) + 'px');
      }
    };

    /**
     * Updates the time of a given layer.
     * @param {object} layer - Layer
     *
     * @function updateLayerTime
     * @memberof Map
     * @inner
     */
    var updateLayerTime = function(layer) {
      var currentDate = moment.utc();
      var layerTimeFormat = Utils.getFormatFromStringWithDatePattern(layer.Params.Time);
      var layerMinTime = moment(Utils.processStringWithDatePattern(layer.Params.Time));
      var useTodaysImage = true;

      if(layer.Params.MinTimeForTodaysImage !== undefined && layer.Params.MinTimeForTodaysImage !== null) {
        layerMinTime = moment(Utils.processStringWithDatePattern(layer.Params.Time) + " " + layer.Params.MinTimeForTodaysImage, layerTimeFormat + " HH:mm:ss");

        if(Utils.processStringWithDatePattern(layer.Params.Time) === currentDate.format(layerTimeFormat))
          useTodaysImage = currentDate.isAfter(layerMinTime);
      }

      var layerName = Utils.applyLayerTimeUpdateButton(layer.Name, layer.Id);

      if(!useTodaysImage) {
        layerMinTime = layerMinTime.subtract(1, "days");

        layer.Params.Time = layerMinTime.format(layerTimeFormat);
        layerName = Utils.replaceDatePatternWithString(layerName, layerMinTime.format('YYYY/MM/DD'));
      } else {
        layerName = Utils.processStringWithDatePattern(layerName);
      }

      if(layer.Wmts) {
        var options = {
          url: layer.Params.Url,
          format: layer.Params.Format,
          matrixSet: layer.Params.MatrixSet,
          tileGrid: layer.Params.TileGrid
        };

        TerraMA2WebComponents.MapDisplay.updateLayerTime(layer.Id, Utils.processStringWithDatePattern(layer.Params.Time), options);
      } else {
        TerraMA2WebComponents.MapDisplay.updateLayerTime(layer.Id, Utils.processStringWithDatePattern(layer.Params.Time));
      }

      if(layer.Params !== undefined && layer.Params.Time !== undefined && layer.Params.TimeYear !== undefined && layer.Params.TimeMonth !== undefined && layer.Params.TimeDay !== undefined) {
        var sourceParams = {};

        var layerTimeDate = Utils.stringToDate(Utils.processStringWithDatePattern(layer.Params.Time), 'YYYY-MM-DD');

        sourceParams[layer.Params.TimeYear] = layerTimeDate.getFullYear().toString();
        sourceParams[layer.Params.TimeMonth] = ('0' + (layerTimeDate.getMonth() + 1)).slice(-2);
        sourceParams[layer.Params.TimeDay] = ('0' + layerTimeDate.getDate()).slice(-2);

        TerraMA2WebComponents.MapDisplay.updateLayerSourceParams(layer.Id, sourceParams, true);
      }

      if($('#' + layer.Id.replace(':', '') + ' > span.terrama2-layerexplorer-checkbox-span').children('.layer-time-update-years').length === 0) {
        $('#' + layer.Id.replace(':', '') + ' > span.terrama2-layerexplorer-checkbox-span').html(layerName);
        TerraMA2WebComponents.MapDisplay.updateLayerAttribute(layer.Id, 'name', layerName);
      }

      $('#slider-' + layer.Id.replace(':', '')).bootstrapSlider();
    };

    /**
     * Initializes the necessary features.
     *
     * @function init
     * @memberof Map
     * @inner
     */
    var init = function() {
      $(document).ready(function() {
        TerraMA2WebComponents.MapDisplay.disableDoubleClickZoom();
        TerraMA2WebComponents.MapDisplay.addMousePosition();
        TerraMA2WebComponents.MapDisplay.addScale();

        addLayersToMap();
        addSubtitles();
        activateMoveMapTool();
      });
    };

    return {
      getMap: getMap,
      getLayers: getLayers,
      getNotAddedLayers: getNotAddedLayers,
      addVisibleLayer: addVisibleLayer,
      removeVisibleLayer: removeVisibleLayer,
      getVisibleLayers: getVisibleLayers,
      addLayerToMap: addLayerToMap,
      removeLayerFromMap: removeLayerFromMap,
      setBackgroundsVisibility: setBackgroundsVisibility,
      resetMapMouseTools: resetMapMouseTools,
      initialExtent: initialExtent,
      activateDragboxTool: activateDragboxTool,
      activateGetFeatureInfoTool: activateGetFeatureInfoTool,
      getSubtitlesSatellites: getSubtitlesSatellites,
      updateSubtitles: updateSubtitles,
      activateMoveMapTool: activateMoveMapTool,
      setSubtitlesVisibility: setSubtitlesVisibility,
      updateZoomTop: updateZoomTop,
      updateLayerTime: updateLayerTime,
      init: init
    };
  }
);
