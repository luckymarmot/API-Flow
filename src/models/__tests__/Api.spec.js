/* eslint-disable max-nested-callbacks */
import expect from 'expect'

import Response from '../Api'

describe('models/Api.js', () => {
  describe('{ Api }', () => {
    describe('#fields', () => {
      it('should have a `requests` field', () => {
        const requests = 'test'
        const data = { requests }

        const instance = new Response(data)

        expect(instance.get('requests')).toEqual(requests)
      })

      it('should have a `group` field', () => {
        const group = 'test'
        const data = { group }

        const instance = new Response(data)

        expect(instance.get('group')).toEqual(group)
      })

      it('should have a `references` field', () => {
        const references = 'test'
        const data = { references }

        const instance = new Response(data)

        expect(instance.get('references')).toEqual(references)
      })

      it('should have a `info` field', () => {
        const info = 'test'
        const data = { info }

        const instance = new Response(data)

        expect(instance.get('info')).toEqual(info)
      })
    })
  })
})
