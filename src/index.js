// @flow
type Variables = { [variable: string]: any }
type Query = { query: string, variables?: Variables, operationName?: string }
type QueryError = {
  message: string,
  locations?: Array<{ line: number, column: number }>,
  path?: any,
  rid: string,
  details?: { [key: string]: any },
}
type Result = { data: { [key: string]: any }, errors: Array<QueryError> }
type Fetcher = (batchedQuery: Array<Query> | Query) => Promise<Array<Result>>
type Options = {
  batchInterval?: number,
  shouldBatch?: boolean,
  maxBatchSize?: number,
}
type Queue = Array<{ request: Query, resolve: Function, reject: Function }>

/**
 * takes a list of requests (queue) and batches them into a single server request.
 * It will then resolve each individual requests promise with the appropriate data.
 * @private
 * @param {QueryBatcher}   client - the client to use
 * @param {Queue} queue  - the list of requests to batch
 */
function dispatchQueueBatch(client: QueryBatcher, queue: Queue): void {
  let batchedQuery = queue.map(item => item.request)
  if (batchedQuery.length === 1) {
    batchedQuery = batchedQuery[0]
  }
  client.fetcher(batchedQuery).then(responses => {
    if (queue.length === 1 && !Array.isArray(responses)) {
      if (responses.errors && responses.errors.length) {
        queue[0].reject(responses)
        return
      }
      queue[0].resolve(responses)
      return
    } else if (responses.length !== queue.length) {
      throw new Error('response length did not match query length')
    }

    for (let i = 0; i < queue.length; i++) {
      if (responses[i].errors && responses[i].errors.length) {
        queue[i].reject(responses[i])
      } else {
        queue[i].resolve(responses[i])
      }
    }
  })
}

/**
 * creates a list of requests to batch according to max batch size.
 * @private
 * @param {QueryBatcher} client - the client to create list of requests from from
 * @param {Options} options - the options for the batch
 */
function dispatchQueue(client: QueryBatcher, options: Options): void {
  const queue = client._queue
  const maxBatchSize = options.maxBatchSize || 0

  client._queue = []

  if (maxBatchSize > 0 && maxBatchSize < queue.length) {
    for (let i = 0; i < queue.length / maxBatchSize; i++) {
      dispatchQueueBatch(
        client,
        queue.slice(i * maxBatchSize, (i + 1) * maxBatchSize)
      )
    }
  } else {
    dispatchQueueBatch(client, queue)
  }
}

/**
 * Create a batcher client.
 * @param {Fetcher} fetcher                 - The url to the graphql endpoint you are targeting.
 * @param {Options} options                 - the options to be used by client
 * @param {boolean} options.shouldBatch     - should the client batch requests. (default true)
 * @param {integer} options.batchInterval   - duration (in MS) of each batch window. (default 6)
 * @param {integer} options.maxBatchSize    - max number of requests in a batch. (default 0)
 * @param {boolean} options.defaultHeaders  - default headers to include with every request
 *
 * @example
 * const fetcher = batchedQuery => fetch('path/to/graphql', {
 *    method: 'post',
 *    headers: {
 *      Accept: 'application/json',
 *      'Content-Type': 'application/json',
 *    },
 *    body: JSON.stringify(batchedQuery),
 *    credentials: 'include',
 * })
 * .then(response => response.json())
 *
 * const client = new QueryBatcher(fetcher, { maxBatchSize: 10 })
 */
export default class QueryBatcher {
  fetcher: Fetcher
  _options: Options
  _queue: Queue
  constructor(
    fetcher: Fetcher,
    { batchInterval = 6, shouldBatch = true, maxBatchSize = 0 }: Options = {}
  ) {
    this.fetcher = fetcher
    this._options = {
      batchInterval,
      shouldBatch,
      maxBatchSize,
    }
    this._queue = []
  }

  /**
   * Fetch will send a graphql request and return the parsed json.
   * @param {string}      query          - the graphql query.
   * @param {Variables}   variables      - any variables you wish to inject as key/value pairs.
   * @param {[string]}    operationName  - the graphql operationName.
   * @param {Options}     overrides      - the client options overrides.
   *
   * @return {promise} resolves to parsed json of server response
   *
   * @example
   * client.fetch(`
   *    query getHuman($id: ID!) {
   *      human(id: $id) {
   *        name
   *        height
   *      }
   *    }
   * `, { id: "1001" }, 'getHuman')
   *    .then(human => {
   *      // do something with human
   *      console.log(human);
   *    });
   */
  fetch(
    query: string,
    variables?: Variables,
    operationName?: string,
    overrides?: Options = {}
  ): Promise<Array<Result>> {
    const request: Query = { query }
    const options = Object.assign({}, this._options, overrides)

    if (variables) {
      request.variables = variables
    }

    if (operationName) {
      request.operationName = operationName
    }

    const promise = new Promise((resolve, reject) => {
      this._queue.push({ request, resolve, reject })

      if (this._queue.length === 1) {
        if (options.shouldBatch) {
          setTimeout(() => dispatchQueue(this, options), options.batchInterval)
        } else {
          dispatchQueue(this, options)
        }
      }
    })

    return promise
  }

  /**
   * Fetch will send a graphql request and return the parsed json.
   * @param {string}      query          - the graphql query.
   * @param {Variables}   variables      - any variables you wish to inject as key/value pairs.
   * @param {[string]}    operationName  - the graphql operationName.
   * @param {Options}     overrides      - the client options overrides.
   *
   * @return {Promise<Array<Result>>} resolves to parsed json of server response
   *
   * @example
   * client.forceFetch(`
   *    query getHuman($id: ID!) {
   *      human(id: $id) {
   *        name
   *        height
   *      }
   *    }
   * `, { id: "1001" }, 'getHuman')
   *    .then(human => {
   *      // do something with human
   *      console.log(human);
   *    });
   */
  forceFetch(
    query: string,
    variables?: Variables,
    operationName?: string,
    overrides?: Options = {}
  ): Promise<Array<Result>> {
    const request: Query = { query }
    const options = Object.assign({}, this._options, overrides, {
      shouldBatch: false,
    })

    if (variables) {
      request.variables = variables
    }

    if (operationName) {
      request.operationName = operationName
    }

    const promise = new Promise((resolve, reject) => {
      const client = new QueryBatcher(this.fetcher, this._options)
      client._queue = [{ request, resolve, reject }]

      dispatchQueue(client, options)
    })

    return promise
  }
}
