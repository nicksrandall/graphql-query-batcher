(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("GraphqlQueryBatcher", [], factory);
	else if(typeof exports === 'object')
		exports["GraphqlQueryBatcher"] = factory();
	else
		root["GraphqlQueryBatcher"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	/**
	 * takes a list of requests (queue) and batches them into a single server request.
	 * It will then resolve each individual requests promise with the appropriate data.
	 * @private
	 * @param {QueryBatcher}   client - the client to use
	 * @param {Array.<object>} queue  - the list of requests to batch
	 */
	function dispatchQueueBatch(client, queue) {
	  var batchedQuery = queue.map(function (item) {
	    return item.request;
	  });
	
	  return fetch(client._url, {
	    method: 'post',
	    headers: {
	      Accept: 'application/json',
	      'Content-Type': 'application/json'
	    },
	    body: JSON.stringify(batchedQuery),
	    credentials: 'include'
	  }).then(function (response) {
	    return response.json();
	  }).then(function (responses) {
	    if (responses.length !== queue.length) return new Error('response length did not match query length');
	
	    for (var i = 0; i < queue.length; i++) {
	      if (responses[i].errors && responses[i].errors.length) {
	        queue[i].reject(responses[i]);
	      } else {
	        queue[i].resolve(responses[i]);
	      }
	    }
	
	    return null;
	  });
	}
	
	/**
	 * creates a list of requests to batch according to max batch size.
	 * @private
	 * @param {QueryBatcher} client - the client to create list of requests from from
	 */
	function dispatchQueue(client, options) {
	  var queue = client._queue;
	  var maxBatchSize = options.maxMatchSize;
	
	  client._queue = [];
	
	  if (maxBatchSize > 0 && maxBatchSize < queue.length) {
	    for (var i = 0; i < queue.length / maxBatchSize; i++) {
	      dispatchQueueBatch(client, queue.slice(i * maxBatchSize, (i + 1) * maxBatchSize));
	    }
	  } else {
	    dispatchQueueBatch(client, queue);
	  }
	}
	
	/**
	 * Create a batcher client.
	 * @param {string}  url                   - The url to the graphql endpoint you are targeting.
	 * @param {object}  options               - the options to be used by client
	 * @param {boolean} options.shouldBatch   - should the client batch requests. (default true)
	 * @param {integer} options.batchInterval - duration (in MS) of each batch window. (default 6)
	 * @param {boolean} options.maxBatchSize  - max number of requests in a batch. (default 0)
	 */
	
	var QueryBatcher = function () {
	  function QueryBatcher(url) {
	    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
	        _ref$batchInterval = _ref.batchInterval,
	        batchInterval = _ref$batchInterval === undefined ? 6 : _ref$batchInterval,
	        _ref$shouldBatch = _ref.shouldBatch,
	        shouldBatch = _ref$shouldBatch === undefined ? true : _ref$shouldBatch,
	        _ref$maxBatchSize = _ref.maxBatchSize,
	        maxBatchSize = _ref$maxBatchSize === undefined ? 0 : _ref$maxBatchSize;
	
	    _classCallCheck(this, QueryBatcher);
	
	    this._url = url;
	    this._options = {
	      batchInterval: batchInterval,
	      shouldBatch: shouldBatch,
	      maxBatchSize: maxBatchSize
	    };
	    this._queue = [];
	  }
	
	  /**
	   * Fetch will send a graphql request and return the parsed json.
	   * @param {string}    query          - the graphql query.
	   * @param {[object]}  variables      - any variables you wish to inject as key/value pairs.
	   * @param {[string]}  operationName  - the graphql operationName.
	   *
	   * @return {promise} resolves to parsed json of server response
	   */
	
	
	  _createClass(QueryBatcher, [{
	    key: 'fetch',
	    value: function fetch(query, variables, operationName) {
	      var _this = this;
	
	      var overrides = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
	
	      var request = { query: query };
	      var options = Object.assign({}, this._options, overrides);
	
	      if (variables) {
	        request.variables = variables;
	      }
	
	      if (operationName) {
	        request.operationName = operationName;
	      }
	
	      var promise = new Promise(function (resolve, reject) {
	        _this._queue.push({ request: request, resolve: resolve, reject: reject });
	
	        if (_this._queue.length === 1) {
	          if (options.shouldBatch) {
	            setTimeout(function () {
	              return dispatchQueue(_this, options);
	            }, options.batchInterval);
	          } else {
	            dispatchQueue(_this, options);
	          }
	        }
	      });
	
	      return promise;
	    }
	  }]);
	
	  return QueryBatcher;
	}();
	
	exports.default = QueryBatcher;
	module.exports = exports['default'];

/***/ }
/******/ ])
});
;
//# sourceMappingURL=GraphqlQueryBatcher.js.map