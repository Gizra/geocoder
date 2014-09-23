/*
 * geocoder
 * https://github.com/Gizra/geocoder
 *
 * Copyright (c) 2014 Gizra
 * Licensed under the MIT license.
 */

// Create a server application
var _ = require('lodash');
var express = require('express');
var geocoder = require('./geocoder');
var request = require('request');
var app = express();


// Expose module.
var geocoderServer = exports;

/**
 * Load an express server.
 */
geocoderServer.load = function() {
  var options = {};

  // /Basic.
  app.use( function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
  });


  /**
   *  From a counters list recieved we process the geocode coordinated.
   *
   *  {
   *    account:{
   *      nid: 35,
   *      token: 'plhwfasfATHJJSZGdfgfgdfgsdfs'
   *    },
   *    counters: [
   *      {
   *        id: 25,
   *        contract: 919834,
   *        address: "שד העצמאות 30",
   *        city: "קרית גת",
   *        description: "אולם כדורסל_שלאון"
   *      },
   *      ...
   *    ]
   *  }
   *
   */
  app.post('/geocode', function(req, res) {

    // Process list of the address and account information.
    geocoder.start(req.data);
    // Response to the server if the post was well recieved.
    var data = {status: 'OK'};
    res.json(data);

  });

  // Start listening.
  options.port = process.env.PORT || 2000;
  app.listen(options.port, function() {
    console.log('Server listening by the port ' + options.port + ' ...');
  });
};


/**
 * Create a request to send a POST with the counters geocode information. In GeoJson standart.
 *
 * @param response
 */
geocoderServer.send = function(response) {
  request.post('http://localhost', {form:{response:response}});
};


// Load the server to receive requests.
geocoderServer.load();

