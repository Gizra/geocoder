/*global describe,it*/
'use strict';
var assert = require('assert'),
  geocoderServer = require('../lib/geocoder-server.js');

describe('geocoder-server node module.', function() {
  it('must be awesome', function() {
    assert( geocoderServer .awesome(), 'awesome');
  });
});
