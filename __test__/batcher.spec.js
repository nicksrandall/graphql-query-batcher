import QueryBatcher from '../src/index.js'

const fetcher = batchedQuery => {
  const results = [{ id: 1 }, { id: 2 }]
  return Promise.resolve(
    results.slice(0, Array.isArray(batchedQuery) ? batchedQuery.length : 1)
  )
}

describe('', function() {
  describe('fetch', function() {
    let mock = jest.fn(fetcher)
    let batcher = new QueryBatcher(mock)
    it('should batch requests', () => {
      const promise1 = batcher.fetch('{ query1 }')
      const promise2 = batcher.fetch('{ query2 }')

      return Promise.all([
        promise1.then(val => {
          return expect(val).toEqual(JSON.parse('{"id": 1}'))
        }),
        promise2.then(val => {
          return expect(val).toEqual(JSON.parse('{"id": 2}'))
        }),
      ]).then(() => expect(mock).toHaveBeenCalledTimes(1))
    })

    it('should force batch requests', () => {
      let mock = jest.fn(fetcher)
      let batcher = new QueryBatcher(mock)
      const promise1 = batcher.forceFetch('{ query1 }')
      const promise2 = batcher.forceFetch('{ query2 }')

      return Promise.all([
        promise1.then(val => {
          return expect(val).toEqual(JSON.parse('{"id": 1}'))
        }),
        promise2.then(val => {
          return expect(val).toEqual(JSON.parse('{"id": 1}'))
        }),
      ]).then(() => expect(mock).toHaveBeenCalledTimes(2))
    })
  })
})
