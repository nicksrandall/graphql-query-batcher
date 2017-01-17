import QueryBatcher from '../src/index.js';
global.fetch = require('jest-fetch-mock');

let batcher;

describe('', function () {
  beforeAll(function () {
    batcher = new QueryBatcher('/graphql');
  });
  describe('fetch', function () {

    it('should batch requests', () => {
      fetch.mockResponseOnce(JSON.stringify([{id: 1},{id: 2}]));
      const promise1 = batcher.fetch('{ query1 }');
      const promise2 = batcher.fetch('{ query2 }');

      return Promise.all([
        promise1.then((val) => {
          return expect(val).toEqual(JSON.parse('{"id": 1}'));
        }),
        promise2.then((val) => {
          return expect(val).toEqual(JSON.parse('{"id": 2}'));
        })
      ])
      .then(() => expect(fetch).toHaveBeenCalledTimes(1));
    });
  });
});
