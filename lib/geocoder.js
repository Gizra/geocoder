var gm = require('googlemaps');
var q = require('q');
var json2csv = require('nice-json2csv');
var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var server = require('./geocoder-server');
var moment = require('moment');


/**
 * Realize the geo convertions logic.
 *
 * @constructor
 */
function Geocoder() {
  var geocoder = this;

  geocoder.location = {};
  geocoder.config = {
    limit: 9,
    timeout: 2000
  };

  /**
   * Get the geocode information from the Google Geocode API of each counter.
   *
   * @param counter
   * @param callback
   */
  function getGeo(counter, callback) {
    var model;
    var address;

    if (!geocoder.config.process) {
      geocoder.config.process = 1;
    }

    // Model.
    model = {
      address: counter.place.address + ', ' + counter.place.locality
    };

    address = model.address;

    // Get geocode.
    // http://code.google.com/apis/maps/documentation/geocoding/
    gm.geocode(address, function(err, data) {

      counter.geocode = {
        status: data.status
      };

      switch (counter.geocode.status) {
        case 'OK':
          counter.geocode = _.assign(counter.geocode, data.results[0]);
          break;
        case 'OVER_QUERY_LIMIT':
          counter.geocode = _.assign(counter.geocode, data.error_message);
          break;
        default:
          counter.geocode = data;
          break;
      }
      geocoder.location = data;
    }, '', '', '', 'he');

    // Limit the request.
    if (geocoder.config.process <= geocoder.config.limit) {
      // Test
      counter.test = counter.id;
      geocoder.config.process++;
      callback();
    }
    else {
      delete geocoder.config['process'];
      setTimeout(function() {
        callback();
      }, geocoder.config.timeout);
    }
  }

  /**
   * Asyncronous Series Workflow Process that search for the counter scrappers
   * and running in background to search the geocode of each counter.   *
   *
   * @param data
   */
  geocoder.start = function(data) {
    var counters = data.counters;

    // Request counters.
    console.log('Preparing data...');


    // Limit the process for test propouse.
    // counters = _.first(counters, 10);
    // For each 9 counters get geocode, wait ~1 second and look for the geocode
    // of the next 9 until finish.
    async.eachSeries(counters, getGeo, function(err) {

      // Crate a request and send to the remote server
      server.send(counters);

      console.log('Done.');
    });

  };

  /**
   * Create and classify array of objects of geocode records.
   *
   * @param data
   * @param type
   * @returns {Array}
   */
  geocoder.prepareDataCsv = function(data, type) {
    var items = [];
    var record = {};

    switch (type) {
      case 'geo':
        // Extract.
        data.forEach(function(item, index) {

          if (item.geocode && item.geocode.status === 'OK') {
            record = {
              id: item.id,
              contract: item.contract,
              type: 'OK',
              status: (item.geocode) ? item.geocode.status : 'NOT_DEFINED',
              address: item.place.address,
              city: item.place.locality,
              description: item.place.description
            };

            // add geocode data if the result are available.
            if (item.geocode) {
              record.lat = item.geocode.geometry.location.lat;
              record.lng = item.geocode.geometry.location.lng;
              record.formatted_address = item.geocode.formatted_address;
              record.zoom_type = item.geocode.types.join(', ');
              record.location_type = item.geocode.geometry.location_type;
            }
          }
          else {
            record = {
              id: item.id,
              contract: item.contract,
              type: 'NOT_GEOCODE',
              status: (item.geocode) ? item.geocode.status : 'NOT_DEFINED',
              address: item.place.address,
              city: item.place.locality,
              description: item.place.description
            };
          }

          items.push(record);
        });

        // Totals.
        console.log('Total: ', items.length, 'OK', _.size(_.where(items, {type: 'OK'})), 'NOT_GEOCODE', _.size(_.where(items, {type: 'NOT_GEOCODE'})) );

        break;
      default:
        items = data;
        break;
    }

    return items
  };

  /**
   * Save the files with the geocodes data classificaed.
   *
   * @param data
   * @param fullpath
   */
  geocoder.save = function(data, fullpath) {
    var dataOk,
      contents = [],
      dataPrepared,
      sharePath = process.env.SHARE_PATH || 'csv/';
    ts = moment().format('X');

    dataPrepared = geocoder.prepareDataCsv(data, 'geo');

    dataOk = _.where(dataPrepared, {type: 'OK', zoom_type: 'street_address'});

    // Prepare content to save.
    contents = [
      {
        content: json2csv.convert(dataOk),
        fullpath: sharePath +'geocode.csv'
      },
      {
        content: json2csv.convert(_.difference(dataPrepared, dataOk)),
        fullpath: sharePath + 'not_geocode.csv'
      },
      {
        content: JSON.stringify(dataOk, null, true),
        fullpath: sharePath + 'markers.json'
      }
    ];

    // Create the files.
    contents.forEach(function(item) {

      fs.writeFile(item.fullpath, item.content, function(err) {
        if(err) {
          console.log(err);
        }
        else {
          console.log('Created ' + item.fullpath);
        }
      });
    });
  }

}

Geocoder.prototype.constructor = Geocoder;

module.exports = new Geocoder();