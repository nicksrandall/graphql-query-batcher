(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("Library", [], factory);
	else if(typeof exports === 'object')
		exports["Library"] = factory();
	else
		root["Library"] = factory();
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
	
	// helper functions
	function dispatchQueueBatch(client, queue) {
	  var batchedQuery = queue.map(function (item) {
	    return item.query;
	  });
	
	  fetch(client._url, {
	    method: 'post',
	    headers: {
	      'Accept': 'application/json',
	      'Content-Type': 'application/json'
	    },
	    body: JSON.stringify(batchedQuery),
	    credentials: 'include'
	  }).then(function (response) {
	    return response.json();
	  }).then(function (responses) {
	    if (responses.length !== queue.length) return new Error("response length did not match query length");
	
	    for (var i = 0; i < queue.length; i++) {
	      if (responses[i].errors && responses[i].errors.length) {
	        queue[i].reject(responses[i]);
	      } else {
	        queue[i].resolve(responses[i]);
	      }
	    }
	  });
	}
	
	function dispatchQueue(client) {
	  var queue = client._queue;
	
	  client._queue = [];
	
	  var maxBatchSize = client._options.maxMatchSize;
	  if (maxBatchSize > 0 && maxBatchSize < queue.length) {
	    for (var i = 0; i < queue.length / maxBatchSize; i++) {
	      dispatchQueueBatch(client, queue.slice(i * maxBatchSize, (i + 1) * maxBatchSize));
	    }
	  } else {
	    dispatchQueueBatch(client, queue);
	  }
	}
	
	// api
	
	var QueryBatcher = function () {
	  function QueryBatcher(url) {
	    var _ref, _ref$batchDuration, _ref$shouldBatch, _ref$maxBatchSize;
	
	    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (_ref = {}, _ref$batchDuration = _ref.batchDuration, batchDuration = _ref$batchDuration === undefined ? 6 : _ref$batchDuration, _ref$shouldBatch = _ref.shouldBatch, shouldBatch = _ref$shouldBatch === undefined ? true : _ref$shouldBatch, _ref$maxBatchSize = _ref.maxBatchSize, maxBatchSize = _ref$maxBatchSize === undefined ? 0 : _ref$maxBatchSize, _ref);
	
	    _classCallCheck(this, QueryBatcher);
	
	    this._url = url;
	    this._options = options;
	    this._queue = [];
	  }
	
	  /**
	   * Fetch will send a graphql request and return the parsed json.
	   * @param query         {string}    the graphql query.
	   * @param variables     {[object]}  any variables you wish to inject as key/value pairs.
	   * @param operationName {[string]}  the graphql operationName.
	   *
	   * @return {promise}
	   */
	
	
	  _createClass(QueryBatcher, [{
	    key: 'fetch',
	    value: function fetch(query, variables, operationName) {
	      var _this = this;
	
	      var request = { query: query };
	
	      if (variables) {
	        request.variables = variables;
	      }
	
	      if (operationName) {
	        request.operationName = operationName;
	      }
	
	      var promise = new Promise(function (resolve, reject) {
	        _this._queue.push({ request: request, resolve: resolve, reject: reject });
	
	        if (_this._queue.length === 0) {
	          if (_this._options.shouldBatch) {
	            setTimeout(function () {
	              return dispatchQueue(_this);
	            }, _this._options.batchDuration);
	          } else {
	            dispatchQueue(_this);
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
//# sourceMappingURL=Library.js.map