/**
 * takes a list of requests (queue) and batches them into a single server request.
 * It will then resolve each individual requests promise with the appropriate data.
 * @private
 * @param {QueryBatcher}   client - the client to use
 * @param {Array.<object>} queue  - the list of requests to batch
 */
function dispatchQueueBatch(client, queue) {
  const batchedQuery = queue.map(item => item.request);

  return fetch(client._url, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(batchedQuery),
    credentials: 'include',
  })
    .then(response => response.json())
    .then(responses => {
      if (responses.length !== queue.length) return new Error('response length did not match query length');

      for (let i = 0; i < queue.length; i++) {
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
  const queue = client._queue;
  const maxBatchSize = options.maxMatchSize;

  client._queue = [];

  if (maxBatchSize > 0 && maxBatchSize < queue.length) {
    for (let i = 0; i < queue.length / maxBatchSize; i++) {
      dispatchQueueBatch(
        client,
        queue.slice(i * maxBatchSize, (i + 1) * maxBatchSize),
      );
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
export default class QueryBatcher {
  constructor(url, { batchInterval = 6, shouldBatch = true, maxBatchSize = 0 } = {}) {
    this._url = url;
    this._options = {
      batchInterval,
      shouldBatch,
      maxBatchSize,
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
  fetch(query, variables, operationName, overrides = {}) {
    const request = { query };
    const options = Object.assign({}, this._options, overrides);

    if (variables) {
      request.variables = variables;
    }

    if (operationName) {
      request.operationName = operationName;
    }

    const promise = new Promise((resolve, reject) => {
      this._queue.push({ request, resolve, reject });

      if (this._queue.length === 1) {
        if (options.shouldBatch) {
          setTimeout(() => dispatchQueue(this, options), options.batchInterval);
        } else {
          dispatchQueue(this, options);
        }
      }

    });

    return promise;
  }
}

