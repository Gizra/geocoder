/*
 * remote-dummy
 * https://github.com/Gizra/geocoder
 *
 * Copyright (c) 2014 Gizra
 * Licensed under the MIT license.
 */

// Create a server application
var _ = require('lodash');
var express = require('express');
var app = express();


// Expose module.
var dummy = exports;

/**
 * Load an express server.
 */
dummy.load = function() {
  var options = {};

  // Basic.
  app.use( function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
  });


  /**
   *
   *  Get response data
   *
   */
  app.post('/open', function(req, res) {

    // Process list of the address and account information.
    console.log(JSON.stringify(req));


  });

  // Start listening.
  options.port = process.env.PORT || 1000;
  app.listen(options.port, function() {
    console.log('Server listening by the port ' + options.port + ' ...');
  });
};

// Load the server to receive requests.
dummy.load();

