# Graphql Query Batcher
A light weight [graphql](http://graphql.org/) query batcher for javascript.

## Usage
```js
import QueryBatcher from 'graphql-query-batcher';

var client = New QueryBatcher('/graphql' /*, options */);

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

## Options
```js
const options = {
  shouldBatch: true,  // should we batch queries?
  batchDuration: 6,   // duration of each batch window (in MS)
  maxBatch: 0,        // max number of requests in a batch (0 = no max)
};
```

## Requirements
The graphql implementation you are using must suppoprt batching! To learn more read this: https://dev-blog.apollodata.com/query-batching-in-apollo-63acfd859862


