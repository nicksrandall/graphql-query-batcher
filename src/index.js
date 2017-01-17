// helper functions
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

function dispatchQueue(client) {
  const queue = client._queue;
  const maxBatchSize = client._options.maxMatchSize;

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

// api
export default class QueryBatcher {
  constructor(url, { batchDuration = 6, shouldBatch = true, maxBatchSize = 0 } = {}) {
    this._url = url;
    this._options = {
      batchDuration,
      shouldBatch,
      maxBatchSize,
    };
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
  fetch(query, variables, operationName) {
    const request = { query };

    if (variables) {
      request.variables = variables;
    }

    if (operationName) {
      request.operationName = operationName;
    }

    const promise = new Promise((resolve, reject) => {
      this._queue.push({ request, resolve, reject });

      if (this._queue.length === 1) {
        if (this._options.shouldBatch) {
          setTimeout(() => dispatchQueue(this), this._options.batchDuration);
        } else {
          dispatchQueue(this);
        }
      }

    });

    return promise;
  }
}

