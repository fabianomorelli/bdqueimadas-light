"use strict";

/**
 * Graphics class of the BDQueimadas.
 * @class Graphics
 * @variation 2
 *
 * @author Jean Souza [jean.souza@funcate.org.br]
 *
 * @property {object} memberFiresCountGraphics - Graphics of fires count.
 * @property {string} memberCountries - Current countries filter.
 * @property {string} memberStates - Current states filter.
 * @property {string} memberCities - Current cities filter.
 * @property {integer} memberLoadingCounter - Counter that indicates how many graphics are loading.
 * @property {boolean} memberUseGraphicsFilter - Flag that indicates if the last filter used was the one present in the graphics page.
 */
define(
  ['components/Utils', 'components/Filter', 'components/Map', 'TerraMA2WebComponents'],
  function(Utils, Filter, Map, TerraMA2WebComponents) {

    // Graphics of fires count
    var memberFiresCountGraphics = {};
    // Current countries filter
    var memberCountries = null;
    // Current states filter
    var memberStates = null;
    // Current cities filter
    var memberCities = null;
    // Counter that indicates how many graphics are loading
    var memberLoadingCounter = 0;
    // Flag that indicates if the last filter used was the one present in the graphics page
    var memberUseGraphicsFilter = false;

    /**
     * Returns the countries, states and cities to be filtered.
     * @param {function} callback - Callback function
     * @returns {function} callback - Execution of the callback function, which will process the received data
     *
     * @private
     * @function getSpatialFilterData
     * @memberof Graphics(2)
     * @inner
     */
    var getSpatialFilterData = function(callback) {
      var countries = $('#countries-graphics').val() === null || (Utils.stringInArray($('#countries-graphics').val(), "") || $('#countries-graphics').val().length === 0) ? [] : $('#countries-graphics').val();
      var states = $('#states-graphics').val() === null || Utils.stringInArray($('#states-graphics').val(), "") || $('#states-graphics').val().length === 0 ? [] : $('#states-graphics').val();

      var filterStates = [];

      $('#states-graphics > option').each(function() {
        if(Utils.stringInArray(states, $(this).val()))
          filterStates.push($(this).val());
      });

      var city = Filter.getCity() !== null ? Filter.getCity() : "";

      callback(countries.toString(), filterStates.toString(), city);
    };

    /**
     * Updates all the graphics.
     * @param {boolean} useGraphicsFilter - Flag that indicates if the graphics filter should be used
     *
     * @function updateGraphics
     * @memberof Graphics(2)
     * @inner
     */
    var updateGraphics = function(useGraphicsFilter) {
      memberUseGraphicsFilter = useGraphicsFilter;

      $('#filter-error-dates-graphics').text('');

      var dates = Utils.getFilterDates(true, true, true, (useGraphicsFilter ? 2 : 0));
      var times = Utils.getFilterTimes(true, (useGraphicsFilter ? 2 : 0));

      if(dates !== null && times !== null) {
        if(dates.length === 0) {
          $('#filter-error-dates-graphics').text('Datas inválidas!');
        } else if(times.length === 0) {
          $('#filter-error-dates-graphics').text('Horas inválidas!');
        } else {
          var dateTimeFrom = Utils.dateToString(Utils.stringToDate(dates[0], 'YYYY/MM/DD'), Utils.getConfigurations().firesDateFormat) + ' ' + times[0];
          var dateTimeTo = Utils.dateToString(Utils.stringToDate(dates[1], 'YYYY/MM/DD'), Utils.getConfigurations().firesDateFormat) + ' ' + times[1];

          if(useGraphicsFilter) {
            var satellites = (Utils.stringInArray($('#filter-satellite-graphics').val(), "all") ? '' : $('#filter-satellite-graphics').val().toString());
            var biomes = (Utils.stringInArray($('#filter-biome-graphics').val(), "all") ? '' : $('#filter-biome-graphics').val().toString());
          } else {
            if(Filter.isInitialFilter()) {
              var satellites = Filter.getInitialSatellites().toString();
            } else {
              var satellites = Utils.stringInArray(Filter.getSatellites(), "all") ? '' : Filter.getSatellites().toString();
            }

            var biomes = Utils.stringInArray(Filter.getBiomes(), "all") ? '' : Filter.getBiomes().toString();
          }

          if(!useGraphicsFilter) {
            $('#filter-date-from-graphics').val(Filter.getFormattedDateFrom('YYYY/MM/DD'));
            $('#filter-date-to-graphics').val(Filter.getFormattedDateTo('YYYY/MM/DD'));
          }

          Filter.updateSatellitesSelect(2, Utils.stringToDate(dates[0], 'YYYY/MM/DD'), Utils.stringToDate(dates[1], 'YYYY/MM/DD'));

          getSpatialFilterData(function(countries, states, cities) {
            memberCountries = countries;
            memberStates = states;
            memberCities = cities;

            var firesCountGraphicsConfig = Utils.getConfigurations().graphicsConfigurations.FiresCount;
            var firesCountGraphicsConfigLength = firesCountGraphicsConfig.length;

            for(var i = 0; i < firesCountGraphicsConfigLength; i++) {

              var loadGraphic = true;

              if(firesCountGraphicsConfig[i].ShowOnlyIfThereIsACountryFiltered && memberCountries === '') {
                loadGraphic = false;
                hideGraphic(firesCountGraphicsConfig[i].Id);
              } else if(firesCountGraphicsConfig[i].ShowOnlyIfThereIsNoCountryFiltered && memberCountries !== '') {
                loadGraphic = false;
                hideGraphic(firesCountGraphicsConfig[i].Id);
              } else if(firesCountGraphicsConfig[i].ShowOnlyIfThereIsAStateFiltered && memberStates === '') {
                loadGraphic = false;
                hideGraphic(firesCountGraphicsConfig[i].Id);
              } else if(firesCountGraphicsConfig[i].ShowOnlyIfThereIsNoStateFiltered && memberStates !== '') {
                loadGraphic = false;
                hideGraphic(firesCountGraphicsConfig[i].Id);
              }

              if(loadGraphic) {
                if(memberFiresCountGraphics[firesCountGraphicsConfig[i].Id] === undefined) {
                  if(firesCountGraphicsConfig[i].Expanded) {
                    var htmlElements = "<div data-sort=\"" + firesCountGraphicsConfig[i].Order + "\" class=\"box box-default graphic-item\" style=\"display: none;\"><div class=\"box-header with-border\"><h3 class=\"box-title\">" +
                                       firesCountGraphicsConfig[i].Title + "<span class=\"additional-title\"> | 0 focos, de " + $('#filter-date-from-graphics').val() + " a " +
                                       $('#filter-date-to-graphics').val() + "</span></h3><div class=\"box-tools pull-right\">" +
                                       "<button type=\"button\" class=\"btn btn-box-tool collapse-btn\" data-widget=\"collapse\">Minimizar</button></div></div>" +
                                       "<div class=\"box-body\" style=\"display: block;\"><div class=\"chart\">" +
                                       "<canvas id=\"fires-count-" + firesCountGraphicsConfig[i].Id + "-graphic\"></canvas>" +
                                       "<a href=\"#\" class=\"btn btn-app graphic-button export-graphic-data\" data-id=\"" + firesCountGraphicsConfig[i].Id +
                                       "\"><i class=\"fa fa-download\"></i>Exportar Todos os Dados em CSV</a>";

                    htmlElements += "<div id=\"fires-count-" + firesCountGraphicsConfig[i].Id +
                                    "-graphic-message-container\" class=\"text-center\">" +
                                    "</div></div></div></div>";
                  } else {
                    var htmlElements = "<div data-sort=\"" + firesCountGraphicsConfig[i].Order + "\" class=\"box box-default graphic-item collapsed-box\" style=\"display: none;\"><div class=\"box-header with-border\"><h3 class=\"box-title\">" +
                                       firesCountGraphicsConfig[i].Title + "<span class=\"additional-title\"> | 0 focos, de " + $('#filter-date-from-graphics').val() + " a " +
                                       $('#filter-date-to-graphics').val() + "</span></h3><div class=\"box-tools pull-right\">" +
                                       "<button type=\"button\" class=\"btn btn-box-tool collapse-btn\" data-widget=\"collapse\">Expandir</button></div></div>" +
                                       "<div class=\"box-body\" style=\"display: none;\"><div class=\"chart\">" +
                                       "<canvas id=\"fires-count-" + firesCountGraphicsConfig[i].Id + "-graphic\"></canvas>" +
                                       "<a href=\"#\" class=\"btn btn-app graphic-button export-graphic-data\" data-id=\"" + firesCountGraphicsConfig[i].Id +
                                       "\"><i class=\"fa fa-download\"></i>Exportar Todos os Dados em CSV</a>";

                    htmlElements += "<div id=\"fires-count-" + firesCountGraphicsConfig[i].Id + "-graphic-message-container\" class=\"text-center\"></div></div></div></div>";
                  }

                  insertGraphicAtPosition(htmlElements);
                  memberFiresCountGraphics[firesCountGraphicsConfig[i].Id] = null;
                }

                memberLoadingCounter++;
                $('#loading-span-graphics-background').removeClass('hide');
                $('#graph-box').addClass('overflow-hidden');

                var dataParams = {
                  dateTimeFrom: dateTimeFrom,
                  dateTimeTo: dateTimeTo,
                  id: firesCountGraphicsConfig[i].Id,
                  y: firesCountGraphicsConfig[i].Y,
                  key: firesCountGraphicsConfig[i].Key,
                  limit: firesCountGraphicsConfig[i].Limit,
                  title: firesCountGraphicsConfig[i].Title,
                  satellites: satellites,
                  biomes: biomes,
                  countries: memberCountries,
                  states: memberStates,
                  cities: memberCities,
                  filterRules: {
                    ignoreCountryFilter: firesCountGraphicsConfig[i].IgnoreCountryFilter,
                    ignoreStateFilter: firesCountGraphicsConfig[i].IgnoreStateFilter,
                    ignoreCityFilter: firesCountGraphicsConfig[i].IgnoreCityFilter,
                    showOnlyIfThereIsACountryFiltered: firesCountGraphicsConfig[i].ShowOnlyIfThereIsACountryFiltered,
                    showOnlyIfThereIsNoCountryFiltered: firesCountGraphicsConfig[i].ShowOnlyIfThereIsNoCountryFiltered,
                    showOnlyIfThereIsAStateFiltered: firesCountGraphicsConfig[i].ShowOnlyIfThereIsAStateFiltered,
                    showOnlyIfThereIsNoStateFiltered: firesCountGraphicsConfig[i].ShowOnlyIfThereIsNoStateFiltered
                  }
                };

                $.ajax({
                  url: Utils.getBaseUrl() + "graphicsfirescount",
                  type: "GET",
                  headers: {
                    'Content-Type':'application/json'
                  },
                  dataType: "json",
                  data: dataParams,
                  success: function(result) {
                    loadFiresCountGraphic(result);
                  }
                });


              }
            }
          });
        }
      }
    };

    /**
     * Inserts a new graphic div in the right order.
     * @param {string} newDiv - New graphic div
     *
     * @private
     * @function insertGraphicAtPosition
     * @memberof Graphics(2)
     * @inner
     */
    var insertGraphicAtPosition = function(newDiv) {
      newDiv = $(newDiv);

      var count = $("div.graphic-item").length;

      if(count > 0) {
        var newDivOrder = parseInt(newDiv.attr("data-sort"));

        $("div.graphic-item").each(function(index) {
          var currentItemOrder = parseInt($(this).attr("data-sort"));

          if(index < count - 1) {
            var nextItemOrder = parseInt($(this).next().attr("data-sort"));

            if(newDivOrder < currentItemOrder) {
              newDiv.insertBefore($(this));
              return false;
            } else if(currentItemOrder == newDivOrder || (newDivOrder > currentItemOrder && newDivOrder < nextItemOrder)) {
              newDiv.insertAfter($(this));
              return false;
            }
          } else {
            newDiv.insertAfter($(this));
            return false;
          }
        });
      } else {
        $("#graphics-container").append(newDiv);
      }
    };

    /**
     * Loads a given graphic of fires count.
     * @param {json} firesCount - Data to be used in the graphic
     *
     * @function loadFiresCountGraphic
     * @memberof Graphics(2)
     * @inner
     */
    var loadFiresCountGraphic = function(firesCount) {
      memberLoadingCounter--;

      if(memberLoadingCounter === 0) {
        $('#loading-span-graphics-background').addClass('hide');
        $('#graph-box').removeClass('overflow-hidden');
      }

      var graphHeight = (firesCount.firesCount.rowCount * 20) + 100;
      var labels = [];
      var values = [];

      var yFields = firesCount.y.match(/[^{\}]+(?=})/g);
      var y = firesCount.y;
      var firesCountItems = firesCount.firesCount.rows;
      var firesCountItemsLength = firesCountItems.length;

      for(var i = 0; i < firesCountItemsLength; i++) {
        var label = y;

        for(var j = 0, count = yFields.length; j < count; j++) {
          var field = (firesCountItems[i][yFields[j]] !== null && firesCountItems[i][yFields[j]] !== undefined && firesCountItems[i][yFields[j]] !== "" ? firesCountItems[i][yFields[j]] : "Não Identificado");

          label = label.replace("{" + yFields[j] + "}", field);
        }

        var percentage = ((parseFloat(firesCountItems[i].count) / parseFloat(firesCount.firesTotalCount.rows[0].count)) * 100).toFixed(1);

        labels.push(label + ' (' + firesCountItems[i].count + ' F | ' + percentage + '%)');
        values.push(firesCountItems[i].count);
      }

      var firesCountGraphicData = {
        labels : labels,
        datasets : [
          {
            backgroundColor : "rgba(220,75,56,0.5)",
            borderColor : "rgba(220,75,56,0.8)",
            hoverBackgroundColor : "rgba(220,75,56,0.75)",
            hoverBorderColor : "rgba(220,75,56,1)",
            data : values
          }
        ]
      };

      if(memberFiresCountGraphics[firesCount.id] !== undefined && memberFiresCountGraphics[firesCount.id] !== null)
        memberFiresCountGraphics[firesCount.id].destroy();

      $("#fires-count-" + firesCount.id + "-graphic").attr('height', graphHeight + 'px');
      $("#fires-count-" + firesCount.id + "-graphic").css('min-height', graphHeight + 'px');
      $("#fires-count-" + firesCount.id + "-graphic").css('max-height', graphHeight + 'px');
      $("#fires-count-" + firesCount.id + "-graphic-message-container").hide();
      $("#fires-count-" + firesCount.id + "-graphic").show();

      var htmlElement = $("#fires-count-" + firesCount.id + "-graphic").get(0).getContext("2d");

      memberFiresCountGraphics[firesCount.id] = new Chart(htmlElement, {
        type: 'horizontalBar',
        data: firesCountGraphicData,
        options: {
          responsive : true,
          maintainAspectRatio: false,
          tooltips: {
            callbacks: {
              label: function(tooltipItems, data) {
                var percentage = ((parseFloat(tooltipItems.xLabel) / parseFloat(firesCount.firesTotalCount.rows[0].count)) * 100).toFixed(1);
                return tooltipItems.xLabel + ' F | ' + percentage + '%';
              }
            }
          },
          legend: {
            display: false
          },
          scales: {
            xAxes: [
              {
                ticks: {
                  beginAtZero: true,
                  stepSize: 5,
                  maxTicksLimit: 20
                }
              }
            ]
          }
        }
      });

      var graphicTotalCount = Utils.sumIntegerArrayItems(values);

      var additionalTitle = " | " + graphicTotalCount + " focos, de " + $('#filter-date-from-graphics').val() + " a " + $('#filter-date-to-graphics').val();
      $("#fires-count-" + firesCount.id + "-graphic").parents('.graphic-item').find('.box-title > .additional-title').text(additionalTitle);
      $("#fires-count-" + firesCount.id + "-graphic").parent().children('.export-graphic-data').show();
      $("#fires-count-" + firesCount.id + "-graphic").parents('.graphic-item').show();

      if(firesCount.firesCount.rowCount <= 1 && firesCount.id == 'firesByCountry') hideGraphic(firesCount.id);
      else if(firesCount.filterRules.showOnlyIfThereIsACountryFiltered && memberCountries === '') hideGraphic(firesCount.id);
      else if(firesCount.filterRules.showOnlyIfThereIsNoCountryFiltered && memberCountries !== '') hideGraphic(firesCount.id);
      else if(firesCount.filterRules.showOnlyIfThereIsAStateFiltered && memberStates === '') hideGraphic(firesCount.id);
      else if(firesCount.filterRules.showOnlyIfThereIsNoStateFiltered && memberStates !== '') hideGraphic(firesCount.id);

      if($('#graphics-container > .graphic-item:visible').length > 0) $('#graphics-no-data').hide();
      else $('#graphics-no-data').show();

      memberFiresCountGraphics[firesCount.id].resize();

      $(".graphic-item > .box-header").on('click', function() {
        var toggleBtn = $(this)[0].lastChild.lastChild;
        if(toggleBtn) toggleBtn.click();
      });
    };

    /**
     * Hides the graphic with the given id.
     * @param {string} id - Graphic id
     *
     * @private
     * @function hideGraphic
     * @memberof Graphics(2)
     * @inner
     */
    var hideGraphic = function(id) {
      $("#fires-count-" + id + "-graphic").parent().children('.export-graphic-data').hide();
      $("#fires-count-" + id + "-graphic").parents('.graphic-item').find('.box-title > .additional-title').text(" | 0 focos, de " + $('#filter-date-from-graphics').val() + " a " + $('#filter-date-to-graphics').val());
      $("#fires-count-" + id + "-graphic").hide();
      $("#fires-count-" + id + "-graphic-message-container").show();
      $("#fires-count-" + id + "-graphic-message-container").html('Não existem dados a serem exibidos!');
      $("#fires-count-" + id + "-graphic").parents('.graphic-item').hide();
    };

    /**
     * Exports graphic data in csv format.
     * @param {string} id - Graphic id
     *
     * @function exportGraphicData
     * @memberof Graphics(2)
     * @inner
     */
    var exportGraphicData = function(id) {
      $('#filter-error-dates-graphics').text('');

      var dates = Utils.getFilterDates(true, true, true, (memberUseGraphicsFilter ? 2 : 0));
      var times = Utils.getFilterTimes(true, (memberUseGraphicsFilter ? 2 : 0));

      if(dates !== null && times !== null) {
        if(dates.length === 0) {
          $('#filter-error-dates-graphics').text('Datas inválidas!');
        } else if(times.length === 0) {
          $('#filter-error-dates-graphics').text('Horas inválidas!');
        } else {
          var dateTimeFrom = Utils.dateToString(Utils.stringToDate(dates[0], 'YYYY/MM/DD'), Utils.getConfigurations().firesDateFormat) + ' ' + times[0];
          var dateTimeTo = Utils.dateToString(Utils.stringToDate(dates[1], 'YYYY/MM/DD'), Utils.getConfigurations().firesDateFormat) + ' ' + times[1];

          if(memberUseGraphicsFilter) {
            var satellites = (Utils.stringInArray($('#filter-satellite-graphics').val(), "all") ? '' : $('#filter-satellite-graphics').val().toString());
            var biomes = (Utils.stringInArray($('#filter-biome-graphics').val(), "all") ? '' : $('#filter-biome-graphics').val().toString());
          } else {
            if(Filter.isInitialFilter()) {
              var satellites = Filter.getInitialSatellites().toString();
            } else {
              var satellites = Utils.stringInArray(Filter.getSatellites(), "all") ? '' : Filter.getSatellites().toString();
            }

            var biomes = Utils.stringInArray(Filter.getBiomes(), "all") ? '' : Filter.getBiomes().toString();
          }

          getSpatialFilterData(function(countries, states, cities) {
            var exportLink = Utils.getBaseUrl() + "export-graphic-data?dateTimeFrom=" + dateTimeFrom + "&dateTimeTo=" + dateTimeTo + "&satellites=" + satellites + "&biomes=" + biomes + "&countries=" + countries + "&states=" + states + "&cities=" + cities + "&id=" + id;
            location.href = exportLink;
          });
        }
      }
    };

    /**
     * Initializes the necessary features.
     *
     * @function init
     * @memberof Graphics(2)
     * @inner
     */
    var init = function() {
      $(document).ready(function() {
        updateGraphics(false);
      });
    };

    return {
      updateGraphics: updateGraphics,
      loadFiresCountGraphic: loadFiresCountGraphic,
      exportGraphicData: exportGraphicData,
      init: init
    };
  }
);
