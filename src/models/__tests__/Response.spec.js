/* eslint-disable max-nested-callbacks */
import expect from 'expect'

import Response from '../Response'

describe('models/Response.js', () => {
  describe('{ Response }', () => {
    describe('#fields', () => {
      it('should have a `code` field', () => {
        const code = 'test'
        const data = { code }

        const instance = new Response(data)

        expect(instance.get('code')).toEqual(code)
      })

      it('should have a `description` field', () => {
        const description = 'test'
        const data = { description }

        const instance = new Response(data)

        expect(instance.get('description')).toEqual(description)
      })

      it('should have a `examples` field', () => {
        const examples = 'test'
        const data = { examples }

        const instance = new Response(data)

        expect(instance.get('examples')).toEqual(examples)
      })

      it('should have a `parameters` field', () => {
        const parameters = 'test'
        const data = { parameters }

        const instance = new Response(data)

        expect(instance.get('parameters')).toEqual(parameters)
      })

      it('should have a `contexts` field', () => {
        const contexts = 'test'
        const data = { contexts }

        const instance = new Response(data)

        expect(instance.get('contexts')).toEqual(contexts)
      })
    })
  })
})
