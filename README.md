# Graphql Query Batcher
A light weight (~700 bytes) [graphql](http://graphql.org/) query batcher for javascript.

## Usage
```js
import QueryBatcher from 'graphql-query-batcher';

// Create a new client with your graphql URL and [optional] options.
const client = New QueryBatcher('/graphql' /*, options */);

// although I am making 2 requests (different IDs), the client will batch them resulting
// in only 1 call to my server
client.fetch(`
  query getHuman($id: ID!) {
    human(id: $id) {
      name
      height
    }
  }
  `, { id: "1000" })
  .then(human => {
    // do something with human
    console.log(human);
  });

client.fetch(`
  query getHuman($id: ID!) {
    human(id: $id) {
      name
      height
    }
  }
  `, { id: "1001" })
  .then(human => {
    // do something with human
    console.log(human);
  });
```

## Docs
### Client Constructor 
- param *url* - {string} the url to the graphql endpoint you are targeting.
- param *options* - [{object}] options for client.
- param *options.shouldBatch* - {boolean} if the client should batch requests.
- param *options.batchInterval* - {integer} duration of each batch window.
- param *options.maxBatchSize* - {integer} the max humber of requests in a batch.

```js
const client = New QueryBatcher(url, options);
```

### client.fetch
- param *query* - {string} the graphql query to send
- param *variables* - {[object]} variables to inject into query
- param *operationName* - {[string]} operation name in query to use
- return {promise} - resolves to parsed json of server response

```js
client.fetch(`
  query getHuman($id: ID!) {
    human(id: $id) {
      name
      height
    }
  }
  `, { id: "1001" }, 'getHuman')
  .then(human => {
    // do something with human
    console.log(human);
  });
```

## Default Options
```js
const options = {
  shouldBatch: true,  // should we batch queries?
  batchInterval: 6,   // duration of each batch window (in MS)
  maxBatchSize: 0,    // max number of requests in a batch (0 = no max)
};
```

## Requirements
### Javascript
- this implementation uses [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). If you want to support [browsers that don't natively support it](http://caniuse.com/#feat=fetch), you'll need to use a [polyfill](https://github.com/github/fetch).

### Graphql
The graphql implementation you are using must suppoprt batching! This means that your graphql endpoint should be able to take an array of requests and return an array of results.

To learn more read this: https://dev-blog.apollodata.com/query-batching-in-apollo-63acfd859862

> To see an expmaple implementation in Golang, see https://github.com/nicksrandall/batched-graphql-handler

## Alternatives
- [Apollo](https://github.com/apollostack/apollo-client)

