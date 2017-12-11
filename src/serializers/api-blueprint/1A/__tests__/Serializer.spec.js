/* eslint-disable max-nested-callbacks */
import expect, { spyOn, restoreSpies } from 'expect'
import { OrderedMap, List } from 'immutable'

import Api from '../../../../models/Api'
import Store from '../../../../models/Store'
import URL from '../../../../models/URL'
import URLComponent from '../../../../models/URLComponent'
import Variable from '../../../../models/Variable'
import Parameter from '../../../../models/Parameter'
import Constraint from '../../../../models/Constraint'
import Info from '../../../../models/Info'
import Resource from '../../../../models/Resource'
import Request from '../../../../models/Request'
import Reference from '../../../../models/Reference'
import ParameterContainer from '../../../../models/ParameterContainer'
import Response from '../../../../models/Response'
import Context from '../../../../models/Context'

/*
import Group from '../../../../models/Group'
import Auth from '../../../../models/Auth'
*/

import Serializer, { __internals__ } from '../Serializer'

describe('serializers/api-blueprint/1A/Serializer.js', () => {
  afterEach(() => restoreSpies())
  describe('{ Serializer }', () => {
    describe('@serialize', () => {
      it('should call __internals__.serialize', () => {
        const expected = 1234
        spyOn(__internals__, 'serialize').andReturn(expected)

        const actual = Serializer.serialize()

        expect(__internals__.serialize).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.serialize with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'serialize').andReturn(expected)

        const input = '123412312'
        const actual = Serializer.serialize(input)

        expect(__internals__.serialize).toHaveBeenCalledWith(input)
        expect(actual).toEqual(expected)
      })
    })

    describe('@validate', () => {
      it('should call __internals__.validate', () => {
        const expected = 1234
        spyOn(__internals__, 'validate').andReturn(expected)

        const actual = Serializer.validate()

        expect(__internals__.validate).toHaveBeenCalled()
        expect(actual).toEqual(expected)
      })

      it('should call __internals__.validate with the correct arguments', () => {
        const expected = 1234
        spyOn(__internals__, 'validate').andReturn(expected)

        const input = '123412312'
        const actual = Serializer.validate(input)

        expect(__internals__.validate).toHaveBeenCalledWith(input)
        expect(actual).toEqual(expected)
      })
    })
  })

  describe('@validate', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        0
      ]
      const actual = inputs.map(input => __internals__.validate(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getRootHostFromEndpoint', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({
          store: new Store({
            endpoint: OrderedMap({
              a: new URL({
                url: 'https://echo.paw.cloud',
                variableDelimiters: List([ '{', '}' ])
              })
            })
          })
        })
      ]
      const expected = [
        null,
        new URL({
          url: 'https://echo.paw.cloud',
          variableDelimiters: List([ '{', '}' ])
        })
      ]
      const actual = inputs.map(input => __internals__.getRootHostFromEndpoint(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getRootHostFromVariable', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({
          store: new Store({
            variable: OrderedMap({
              a: new Variable()
            })
          })
        }),
        new Api({
          store: new Store({
            variable: OrderedMap({
              a: new Variable({
                values: null
              })
            })
          })
        }),
        new Api({
          store: new Store({
            variable: OrderedMap({
              a: new Variable({
                values: OrderedMap({
                  default: 'https://echo.paw.cloud/'
                })
              })
            })
          })
        })
      ]
      const expected = [
        null,
        null,
        null,
        new URL({ url: 'https://echo.paw.cloud' })
      ]
      const actual = inputs.map(input => __internals__.getRootHostFromVariable(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getRootHostForApi', () => {
    it('should work', () => {
      spyOn(__internals__, 'getRootHostFromEndpoint').andCall(({ e }) => e || null)
      spyOn(__internals__, 'getRootHostFromVariable').andCall(({ v }) => v || null)

      const inputs = [
        { e: 123 },
        { v: 234 }
      ]
      const expected = [
        123,
        234
      ]
      const actual = inputs.map(input => __internals__.getRootHostForApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createFormatVersionSection', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        {
          type: 'content',
          value: 'FORMAT: 1A'
        }
      ]
      const actual = inputs.map(input => __internals__.createFormatVersionSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createFormatHostSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'getRootHostForApi').andCall(({ host }) => host)
      const inputs = [
        { host: null },
        {
          host: new URL({
            url: 'https://echo.paw.cloud/{version}',
            variableDelimiters: List([ '{', '}' ])
          })
        },
        {
          host: new URL({
            url: 'https://echo.paw.cloud/{version}',
            variableDelimiters: List([ '{', '}' ])
          }).set('pathname', new URLComponent({
            componentName: 'pathname',
            string: '/{version}',
            parameter: new Parameter({
              key: 'pathname',
              name: 'pathname',
              superType: 'sequence',
              type: 'string',
              value: List([
                new Parameter({
                  type: 'string',
                  default: '/'
                }),
                new Parameter({
                  key: 'version',
                  type: 'string',
                  constraints: List([
                    new Constraint.Enum([ '2.1', '2.3' ])
                  ])
                })
              ])
            }),
            variableDelimiters: List([ '{', '}' ])
          }))
        },
        {
          host: new URL({
            url: 'https://echo.paw.cloud/{version}',
            variableDelimiters: List([ '{', '}' ])
          }).set('pathname', new URLComponent({
            componentName: 'pathname',
            string: '/{version}',
            parameter: new Parameter({
              key: 'pathname',
              name: 'pathname',
              superType: 'sequence',
              type: 'string',
              value: List([
                new Parameter({
                  type: 'string',
                  default: '/'
                }),
                new Parameter({
                  key: 'version',
                  type: 'string',
                  default: '2.3',
                  constraints: List([
                    new Constraint.Enum([ '2.1', '2.3' ])
                  ])
                })
              ])
            }),
            variableDelimiters: List([ '{', '}' ])
          }))
        },
        {
          host: new URL().set('slashes', false)
        }
      ]
      const expected = [
        null,
        {
          type: 'content',
          value: 'HOST: https://echo.paw.cloud/{version}'
        },
        {
          type: 'content',
          value: 'HOST: https://echo.paw.cloud/{version}'
        },
        {
          type: 'content',
          value: 'HOST: https://echo.paw.cloud/{version}'
        },
        null
      ]
      const actual = inputs.map(input => __internals__.createFormatHostSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createMetadataSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createFormatVersionSection').andCall(v => v % 2 ? v * 2 : null)
      spyOn(__internals__, 'createFormatHostSection').andCall(v => v < 300 ? v * 3 : null)
      const inputs = [
        123,
        234,
        345
      ]
      const expected = [
        {
          type: 'metadata',
          abstract: true,
          content: [ 123 * 2, 123 * 3 ],
          separator: '\n'
        },
        {
          type: 'metadata',
          abstract: true,
          content: [ 234 * 3 ],
          separator: '\n'
        },
        {
          type: 'metadata',
          abstract: true,
          content: [ 345 * 2 ],
          separator: '\n'
        }
      ]
      const actual = inputs.map(input => __internals__.createMetadataSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRootTitleSection', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({
          info: new Info({ title: 'some title' })
        })
      ]
      const expected = [
        {
          type: 'header',
          depth: 1,
          value: {
            abstract: true,
            content: [ 'Unnamed API' ],
            separator: ''
          }
        },
        {
          type: 'header',
          depth: 1,
          value: {
            abstract: true,
            content: [ 'some title' ],
            separator: ''
          }
        }
      ]
      const actual = inputs.map(input => __internals__.createRootTitleSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createRootDescriptionSection', () => {
    it('should work', () => {
      const inputs = [
        new Api(),
        new Api({
          info: new Info({
            description: 'some description'
          })
        })
      ]
      const expected = [
        null,
        {
          type: 'content',
          value: 'some description'
        }
      ]
      const actual = inputs.map(input => __internals__.createRootDescriptionSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createApiNameAndOverviewSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createRootTitleSection').andCall(v => v % 2 ? v * 2 : null)
      spyOn(__internals__, 'createRootDescriptionSection').andCall(v => v < 300 ? v * 3 : null)

      const inputs = [
        123,
        234,
        345
      ]
      const expected = [
        {
          type: 'overview',
          abstract: true,
          content: [ 123 * 2, 123 * 3 ],
          separator: '\n'
        },
        {
          type: 'overview',
          abstract: true,
          content: [ 234 * 3 ],
          separator: '\n'
        },
        {
          type: 'overview',
          abstract: true,
          content: [ 345 * 2 ],
          separator: '\n'
        }
      ]
      const actual = inputs.map(input => __internals__.createApiNameAndOverviewSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createResourceGroupHeaderSection', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        {
          type: 'header',
          depth: 2,
          value: {
            abstract: true,
            content: [ 'Group Resources' ],
            separator: ''
          }
        }
      ]
      const actual = inputs.map(input => __internals__.createResourceGroupHeaderSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertResourceIntoResourceEntryBasedOnPath', () => {
    it('should work', () => {
      const inputs = [
        new Resource({
          path: new URL({
            url: 'https://echo.paw.cloud/{{version}}',
            variableDelimiters: List([ '{{', '}}' ])
          })
        })
      ]
      const expected = [
        {
          key: 'https://echo.paw.cloud/{version}',
          value: new Resource({
            path: new URL({
              url: 'https://echo.paw.cloud/{{version}}',
              variableDelimiters: List([ '{{', '}}' ])
            })
          })
        }
      ]

      const actual = inputs.map(
        input => __internals__.convertResourceIntoResourceEntryBasedOnPath(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@mergeResourceEntriesBasedOnKey', () => {
    it('should work', () => {
      const inputs = [
        [ {}, { key: 'abc', value: 123 } ],
        [
          {
            abc: new Resource({
              description: 'preserved',
              methods: OrderedMap({
                a: 123
              })
            })
          },
          {
            key: 'abc', value: new Resource({
              description: 'dropped',
              methods: OrderedMap({
                b: 234
              })
            })
          }
        ],
        [
          {
            abc: new Resource({
              description: 'preserved',
              methods: OrderedMap({
                a: 123,
                b: 234
              })
            })
          },
          {
            key: 'abc', value: new Resource({
              description: 'dropped',
              methods: OrderedMap({
                b: 345,
                c: 456
              })
            })
          }
        ]
      ]
      const expected = [
        { abc: 123 },
        { abc: new Resource({
          description: 'preserved',
          methods: OrderedMap({
            a: 123,
            b: 234
          })
        }) },
        { abc: new Resource({
          description: 'preserved',
          methods: OrderedMap({
            a: 123,
            b: 345,
            c: 456
          })
        }) }
      ]
      const actual = inputs.map(input => __internals__.mergeResourceEntriesBasedOnKey(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getMergedResourcesBasedOnPathFromApi', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertResourceIntoResourceEntryBasedOnPath').andCall(v => v * 2)
      spyOn(__internals__, 'mergeResourceEntriesBasedOnKey')
        .andCall((a, v, k) => Object.assign(a, { [k]: v }))

      const inputs = [
        new Api(),
        new Api({
          resources: OrderedMap({
            a: 123,
            b: 234,
            c: 345
          })
        })
      ]
      const expected = [
        OrderedMap(),
        OrderedMap({
          a: 123 * 2,
          b: 234 * 2,
          c: 345 * 2
        })
      ]
      const actual = inputs.map(input => __internals__.getMergedResourcesBasedOnPathFromApi(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractQueryParametersFromResourceWithDuplicates', () => {
    it('should work', () => {
      const inputs = [
        [ new Api(), new Resource() ],
        [ new Api(), new Resource({
          methods: OrderedMap({
            a: new Request(),
            b: new Request()
          })
        }) ],
        [ new Api(), new Resource({
          methods: OrderedMap({
            a: new Request({
              parameters: new ParameterContainer({
                headers: OrderedMap({
                  a1: new Parameter({ key: 'a1' }),
                  a2: new Parameter({ key: 'a2' })
                })
              })
            }),
            b: new Request()
          })
        }) ],
        [ new Api(), new Resource({
          methods: OrderedMap({
            a: new Request({
              parameters: new ParameterContainer({
                queries: OrderedMap({
                  a1: new Parameter({ key: 'a1' }),
                  a2: new Parameter({ key: 'a2' })
                })
              })
            }),
            b: new Request({
              parameters: new ParameterContainer({
                queries: OrderedMap({
                  b1: new Parameter({ key: 'b1' }),
                  b2: new Parameter({ key: 'b2' })
                }),
                headers: OrderedMap({
                  b3: new Parameter({ key: 'b3' })
                })
              })
            })
          })
        }) ],
        [ new Api(), new Resource({
          methods: OrderedMap({
            a: new Request({
              parameters: new ParameterContainer({
                queries: OrderedMap({
                  a1: new Parameter({ key: 'a1' }),
                  a2: new Parameter({ key: 'a2' }),
                  // checks if duplicates are removed
                  s1: new Parameter({ key: 's1' })
                })
              })
            }),
            b: new Request({
              parameters: new ParameterContainer({
                queries: OrderedMap({
                  b1: new Parameter({ key: 'b1' }),
                  b2: new Parameter({ key: 'b2' }),
                  s1: new Parameter({ key: 's1' })
                }),
                headers: OrderedMap({
                  b3: new Parameter({ key: 'b3' })
                })
              })
            })
          })
        }) ],
        [ new Api({
          store: new Store({
            parameter: OrderedMap({
              s2: new Parameter({ key: 's2' }),
              s3: new Parameter({ key: 's3' }),
              s4: new Parameter({ key: 's4' }),
              s5: new Parameter({ key: 's5' })
            })
          })
        }), new Resource({
          methods: OrderedMap({
            a: new Request({
              parameters: new ParameterContainer({
                queries: OrderedMap({
                  a1: new Parameter({ key: 'a1' }),
                  a2: new Parameter({ key: 'a2' }),
                  s1: new Parameter({ key: 's1' }),
                  // checks if Reference are resolved correctly
                  s2: new Reference({ type: 'parameter', uuid: 's2' }),
                  // checks if multiple references pointing to the same param are not duplicated
                  s3: new Reference({ type: 'parameter', uuid: 's3' }),
                  // checks if a Param & Reference with the same resolved `key` are not duplicated
                  s4: new Parameter({ key: 's4' })
                })
              })
            }),
            b: new Request({
              parameters: new ParameterContainer({
                queries: OrderedMap({
                  b1: new Parameter({ key: 'b1' }),
                  b2: new Parameter({ key: 'b2' }),
                  s1: new Parameter({ key: 's1' }),
                  s3: new Reference({ type: 'parameter', uuid: 's3' }),
                  s4: new Reference({ type: 'parameter', uuid: 's4' })
                }),
                headers: OrderedMap({
                  b3: new Parameter({ key: 'b3' })
                })
              })
            })
          })
        }) ]
      ]
      const expected = [
        [],
        [],
        [],
        [ 'a1', 'a2', 'b1', 'b2' ],
        [ 'a1', 'a2', 's1', 'b1', 'b2', 's1' ],
        [ 'a1', 'a2', 's1', 's2', 's3', 's4', 'b1', 'b2', 's1', 's3', 's4' ]
      ]
      const actual = inputs.map(
        input => __internals__.extractQueryParametersFromResourceWithDuplicates(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@deduplicateArray', () => {
    it('should work', () => {
      const inputs = [
        [ 123, 123, 234, 345, 123, 234, 345, 234 ]
      ]
      const expected = [
        [ 123, 234, 345 ]
      ]
      const actual = inputs.map(input => __internals__.deduplicateArray(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractQueryParametersFromResource', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractQueryParametersFromResourceWithDuplicates')
        .andCall((a, r) => [ a * 2, r * 2 ])
      spyOn(__internals__, 'deduplicateArray').andCall(a => a.map(v => v * 3))
      const inputs = [
        [ 123, 234 ]
      ]
      const expected = [
        [ 123 * 2 * 3, 234 * 2 * 3 ]
      ]
      const actual = inputs.map(input => __internals__.extractQueryParametersFromResource(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractQueryStringFromResource', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractQueryParametersFromResource')
        .andCall((a, r) => a ? [ a * 2, r * 2 ] : [])
      const inputs = [
        [ null, null ],
        [ 123, 234 ]
      ]
      const expected = [
        null,
        {
          type: 'query-params',
          abstract: true,
          content: [
            '{?',
            {
              abstract: true,
              content: [ 123 * 2, 234 * 2 ],
              separator: ','
            },
            '}'
          ],
          separator: ''
        }
      ]
      const actual = inputs.map(input => __internals__.extractQueryStringFromResource(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createResourceTitleSectionContent', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractQueryStringFromResource').andCall(a => a)

      const inputs = [
        [ null, new Resource({
          name: null,
          path: new URL({ url: '/users/{userId}', variableDelimiters: List([ '{', '}' ]) })
        }) ],
        [ null, new Resource({
          name: '/customers/{userId}',
          path: new URL({ url: '/users/{userId}', variableDelimiters: List([ '{', '}' ]) })
        }) ],
        [ null, new Resource({
          name: 'User Operations',
          path: new URL({ url: '/users/{userId}', variableDelimiters: List([ '{', '}' ]) })
        }) ],
        [ '{?graphql}', new Resource({
          name: 'User Operations',
          path: new URL({ url: '/users/{userId}', variableDelimiters: List([ '{', '}' ]) })
        }) ],
        [ '{?graphql}', new Resource({
          path: new URL({ url: '/users/{userId}', variableDelimiters: List([ '{', '}' ]) })
        }) ],
        [ '{?graphql}', new Resource({
          path: (new URL()).set('slashes', false)
        }) ]
      ]
      const expected = [
        [ '/users/{userId}' ],
        [ '/users/{userId}' ],
        [ 'User Operations', ' [', '/users/{userId}', ']' ],
        [ 'User Operations', ' [', '/users/{userId}', '{?graphql}', ']' ],
        [ '/users/{userId}', '{?graphql}' ],
        [ '/', '{?graphql}' ]
      ]
      const actual = inputs.map(input => __internals__.createResourceTitleSectionContent(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createResourceTitleSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createResourceTitleSectionContent')
        .andCall((a, r) => a ? [ a * 2, r * 2 ] : [])

      const inputs = [
        [ null, null ],
        [ 123, 234 ]
      ]
      const expected = [
        null,
        {
          type: 'header',
          depth: 3,
          value: {
            abstract: true,
            content: [ 123 * 2, 234 * 2 ],
            separator: ''
          }
        }
      ]
      const actual = inputs.map(input => __internals__.createResourceTitleSection(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createResourceDescriptionSection', () => {
    it('should work', () => {
      const inputs = [
        new Resource(),
        new Resource({
          description: 'abc'
        })
      ]
      const expected = [
        null,
        {
          type: 'content',
          value: 'abc'
        }
      ]
      const actual = inputs.map(input => __internals__.createResourceDescriptionSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationTitleSectionContent', () => {
    it('should work', () => {
      const inputs = [
        new Request(),
        new Request({
          name: 'get user by id'
        }),
        new Request({
          method: 'get'
        }),
        new Request({
          name: 'get user by id',
          method: 'get'
        })
      ]
      const expected = [
        [],
        [],
        [ 'GET' ],
        [ 'get user by id', ' [', 'GET', ']' ]
      ]
      const actual = inputs.map(input => __internals__.createOperationTitleSectionContent(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationTitleSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createOperationTitleSectionContent')
        .andCall(o => o.map(v => v * 2))

      const inputs = [
        [],
        [ 123 ]
      ]
      const expected = [
        null,
        {
          type: 'header',
          depth: 4,
          value: {
            abstract: true,
            content: [ 123 * 2 ],
            separator: ''
          }
        }
      ]
      const actual = inputs.map(input => __internals__.createOperationTitleSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationDescriptionSection', () => {
    it('should work', () => {
      const inputs = [
        new Request(),
        new Request({
          description: 'abc'
        })
      ]
      const expected = [
        null,
        { type: 'content', value: 'abc' }
      ]
      const actual = inputs.map(input => __internals__.createOperationDescriptionSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createParameterKeySegment', () => {
    it('should work', () => {
      const inputs = [
        new Parameter(),
        new Parameter({
          key: 'limit'
        })
      ]
      const expected = [
        null,
        {
          abstract: true,
          content: [ 'limit' ],
          separator: ''
        }
      ]
      const actual = inputs.map(input => __internals__.createParameterKeySegment(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createParameterOptionalSegmentContent', () => {
    it('should work', () => {
      const inputs = [
        [ {}, new Parameter() ],
        [ {}, new Parameter({ type: 'string' }) ],
        [ { type: 'number' }, new Parameter({ type: 'string' }) ],
        [ { type: 'number' }, new Parameter({ type: 'string', required: true }) ]
      ]
      const expected = [
        [ 'optional' ],
        [ 'string', 'optional' ],
        [ 'number', 'optional' ],
        [ 'number', 'required' ]
      ]
      const actual = inputs.map(
        input => __internals__.createParameterOptionalSegmentContent(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createParameterOptionalSegment', () => {
    it('should work', () => {
      spyOn(__internals__, 'createParameterOptionalSegmentContent')
        .andCall((s, p) => s ? [ s * 2, p * 2 ] : [])
      const inputs = [
        [ null, null ],
        [ 123, 234 ]
      ]
      const expected = [
        null,
        {
          abstract: true,
          content: [
            '(',
            {
              abstract: true,
              content: [ 123 * 2, 234 * 2 ],
              separator: ', '
            },
            ')'
          ],
          separator: ''
        }
      ]
      const actual = inputs.map(input => __internals__.createParameterOptionalSegment(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createParameterDescriptionSegment', () => {
    it('should work', () => {
      const inputs = [
        [ {}, new Parameter() ],
        [ {}, new Parameter({ description: 'abc' }) ],
        [ { description: 'def' }, new Parameter({ description: 'abc' }) ]
      ]
      const expected = [
        null,
        {
          abstract: true,
          content: [ '-', 'abc' ],
          separator: ' '
        },
        {
          abstract: true,
          content: [ '-', 'def' ],
          separator: ' '
        }
      ]
      const actual = inputs.map(input => __internals__.createParameterDescriptionSegment(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createParameterPayloadSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createParameterKeySegment').andCall(p => p ? p * 2 : null)
      spyOn(__internals__, 'createParameterOptionalSegment').andCall((s, p) => s ? s + p : null)
      spyOn(__internals__, 'createParameterDescriptionSegment').andCall((s, p) => s ? s * p : null)

      const inputs = [
        [ null, null ],
        [ 123, 234 ]
      ]
      const expected = [
        null,
        {
          abstract: true,
          content: [
            234 * 2,
            123 + 234,
            123 * 234
          ].filter(v => !!v),
          separator: ' '
        }
      ]
      const actual = inputs.map(input => __internals__.createParameterPayloadSection(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertParameterIntoParamSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createParameterPayloadSection')
        .andCall(s => s['x-title'] || null)
      spyOn(__internals__, 'createOperationRequestSchemaAssetSection')
        .andCall(s => s['x-title'] ? s['x-title'] * 2 : null)

      const inputs = [
        null,
        new Parameter(),
        new Parameter({ key: 123 })
      ]
      const expected = [
        null,
        null,
        {
          type: 'parameter',
          abstract: true,
          content: [
            123,
            123 * 2
          ],
          separator: '\n'
        }
      ]
      const actual = inputs.map(input => __internals__.convertParameterIntoParamSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractPathParamsFromPath', () => {
    it('should work', () => {
      const inputs = [
        new URL({ url: '/users', variableDelimiters: List([ '{', '}' ]) }),
        new URL({ url: '/users/{userId}', variableDelimiters: List([ '{', '}' ]) }),
        new URL({ url: '/users/{userId}', variableDelimiters: List([ '{', '}' ]) })
          .set('pathname', new URLComponent({
            parameter: new Parameter({ superType: 'sequence' })
          })
        ),
        new URL({ url: '/users/{userId}', variableDelimiters: List([ '{', '}' ]) })
          .set('pathname', new URLComponent({
            parameter: new Parameter({ superType: 'sequence', value: List() })
          })
        )
      ]
      const expected = [
        [],
        [ new Parameter({
          key: 'userId',
          name: 'userId',
          type: 'string',
          default: 'userId'
        }) ],
        [],
        []
      ]
      const actual = inputs.map(input => __internals__.extractPathParamsFromPath(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationParametersSectionContent', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertParameterIntoParamSection')
        .andCall(v => v * 2)
      spyOn(__internals__, 'extractPathParamsFromPath').andCall(a => a.map(v => v * 3))

      const inputs = [
        [ [], new ParameterContainer() ],
        [ [], new ParameterContainer({
          queries: OrderedMap({
            a: 123,
            b: 234
          })
        }) ],
        [ [ 345 ], new ParameterContainer({
          queries: OrderedMap({
            a: 123,
            b: 234
          })
        }) ]
      ]

      const expected = [
        [],
        [ 123 * 2, 234 * 2 ],
        [ 123 * 2, 234 * 2, 345 * 2 * 3 ]
      ]

      const actual = inputs.map(
        input => __internals__.createOperationParametersSectionContent(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationParametersSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createOperationParametersSectionContent')
        .andCall((p, c) => p ? [ p * 2, c * 2 ] : [])

      const inputs = [
        [ null, null ],
        [ 123, 234 ]
      ]
      const expected = [
        null,
        {
          type: 'list-item',
          abstract: true,
          content: [
            'Parameters',
            {
              type: 'list',
              depth: 2,
              value: [ 123 * 2, 234 * 2 ]
            }
          ],
          separator: '\n'
        }
      ]

      const actual = inputs.map(input => __internals__.createOperationParametersSection(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@extractContentTypeFromConstraints', () => {
    it('should work', () => {
      const inputs = [
        List(),
        List([
          new Parameter({ key: 'Accept', default: 'application/json' })
        ]),
        List([
          new Parameter({ key: 'Accept', default: 'application/json' }),
          new Parameter({ key: 'Content-Type', default: 'application/json' })
        ]),
        List([
          new Parameter({ key: 'Accept', default: 'application/json' }),
          new Parameter({ key: 'Content-Type', default: 'application/json' }),
          new Parameter({ key: 'Content-Type', default: 'application/xml' })
        ]),
        List([
          new Parameter({ key: 'Accept', default: 'application/json' }),
          new Parameter({ key: 'Content-Type' })
        ])
      ]
      const expected = [
        null,
        null,
        'application/json',
        null,
        null
      ]
      const actual = inputs.map(input => __internals__.extractContentTypeFromConstraints(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationRequestTitleSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractContentTypeFromConstraints').andCall(c => c ? c * 2 : null)

      const inputs = [
        null,
        123
      ]

      const expected = [
        {
          type: 'content',
          value: 'Request'
        },
        {
          abstract: true,
          content: [
            'Request (',
            123 * 2,
            ')'
          ],
          separator: ''
        }
      ]

      const actual = inputs.map(input => __internals__.createOperationRequestTitleSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertHeaderParameterIntoHeaderSection', () => {
    it('should work', () => {
      const inputs = [
        new Parameter(),
        new Parameter({
          key: 'Content-Type',
          default: 'application/json',
          constraints: List([
            new Constraint.JSONSchema({ type: 'string', pattern: 'application/.*+?json' })
          ])
        }),
        new Parameter({
          key: 'Content-Type',
          constraints: List([
            new Constraint.JSONSchema({ type: 'string', pattern: 'application/.*+?json' })
          ])
        }),
        new Parameter({
          key: 'Content-Type',
          constraints: List([
            new Constraint.JSONSchema({
              type: 'string',
              default: 'application/json',
              pattern: 'application/.*+?json'
            })
          ])
        }),
        new Parameter({
          key: 'Content-Type',
          constraints: List([
            new Constraint.JSONSchema({
              type: 'string',
              enum: [ 'application/json', 'application/xml' ]
            })
          ])
        })
      ]
      const expected = [
        'null: null',
        'Content-Type: application/json',
        'Content-Type: null',
        'Content-Type: application/json',
        'Content-Type: application/json'
      ]
      const actual = inputs.map(
        input => __internals__.convertHeaderParameterIntoHeaderSection(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@getHeadersForOperationRequest', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractContentTypeFromConstraints').andCall(v => v)
      const inputs = [
        [ null, new ParameterContainer(), null ],
        [ null, new ParameterContainer({
          headers: OrderedMap({
            a: new Parameter({ key: 'X-Origin' }),
            b: new Parameter({ key: 'Content-Type' })
          })
        }), null ],
        [ 'application/json', new ParameterContainer({
          headers: OrderedMap({
            a: new Parameter({ key: 'X-Origin' }),
            b: new Parameter({ key: 'Content-Type' })
          })
        }), null ],
        [ null, new ParameterContainer({
          headers: OrderedMap({
            a: new Parameter({ key: 'X-Origin' }),
            b: new Parameter({ key: 'Content-Type' })
          })
        }), 'get' ],
        [ 'application/json', new ParameterContainer({
          headers: OrderedMap({
            a: new Parameter({ key: 'X-Origin' }),
            b: new Parameter({ key: 'Content-Type' })
          })
        }), 'post' ],
        [ 'application/json', new ParameterContainer({
          headers: OrderedMap({
            b: new Parameter({ key: 'Content-Type' })
          })
        }), 'post' ]
      ]
      const expected = [
        null,
        OrderedMap({
          a: new Parameter({ key: 'X-Origin' }),
          b: new Parameter({ key: 'Content-Type' })
        }),
        OrderedMap({
          a: new Parameter({ key: 'X-Origin' })
        }),
        OrderedMap({
          a: new Parameter({ key: 'X-Origin' })
        }),
        OrderedMap({
          a: new Parameter({ key: 'X-Origin' })
        }),
        null
      ]
      const actual = inputs.map(input => __internals__.getHeadersForOperationRequest(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationRequestHeaderSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'getHeadersForOperationRequest').andCall((cs, c, m) => {
        return cs ? List([ cs * 2, c * 2, m * 2 ]) : null
      })

      spyOn(__internals__, 'convertHeaderParameterIntoHeaderSection').andCall(v => v * 3)

      const inputs = [
        [ null, null, null, null ],
        [ 123, 234, 345, 456 ]
      ]

      const expected = [
        null,
        {
          type: 'list',
          depth: 2,
          value: [
            {
              abstract: true,
              content: [
                'Headers',
                {
                  type: 'asset',
                  depth: 4,
                  value: [ 234 * 2 * 3, 345 * 2 * 3, 456 * 2 * 3 ].join('\n')
                }
              ],
              separator: '\n'
            }
          ]
        }
      ]
      const actual = inputs.map(
        input => __internals__.createOperationRequestHeaderSection(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationRequestSchemaAssetSection', () => {
    it('should work', () => {
      const inputs = [
        123
      ]
      const expected = [
        {
          type: 'asset',
          depth: 4,
          value: 123
        }
      ]

      const actual = inputs.map(
        input => __internals__.createOperationRequestSchemaAssetSection(input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaForSingleBodyParameter', () => {
    it('should work', () => {
      const inputs = [
        OrderedMap({
          a: new Parameter({
            constraints: List([
              new Constraint.JSONSchema({
                type: 'string',
                pattern: '[0-9a-f]{16}'
              })
            ])
          })
        })
      ]
      const expected = [
        {
          type: 'string',
          pattern: '[0-9a-f]{16}'
        }
      ]
      const actual = inputs.map(input => __internals__.getSchemaForSingleBodyParameter(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaForMultipleBodyParameters', () => {
    it('should work', () => {
      const inputs = [
        OrderedMap(),
        OrderedMap({
          a: new Parameter({
            constraints: List([ new Constraint.JSONSchema({ pattern: '[0-9a-f]{16}' }) ])
          }),
          b: new Parameter({
            key: 'b2',
            constraints: List([ new Constraint.JSONSchema({ pattern: '[0-9a-f]{10}' }) ])
          }),
          c: new Parameter({
            constraints: List([
              new Constraint.JSONSchema({ title: 'c2', pattern: '[0-9a-f]{13}' })
            ])
          })
        })
      ]

      const expected = [
        { type: 'object', properties: {} },
        { type: 'object', properties: {
          a: { pattern: '[0-9a-f]{16}' },
          b2: { pattern: '[0-9a-f]{10}', 'x-title': 'b2' },
          c2: { pattern: '[0-9a-f]{13}', title: 'c2' }
        } }
      ]
      const actual = inputs.map(input => __internals__.getSchemaForMultipleBodyParameters(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@getSchemaFromBodyParameters', () => {
    it('should work', () => {
      spyOn(__internals__, 'getSchemaForSingleBodyParameter')
        .andCall(p => p.map(v => v * 2).valueSeq().toJS())
      spyOn(__internals__, 'getSchemaForMultipleBodyParameters')
        .andCall(p => p.map(v => v * 3).valueSeq().toJS())

      const inputs = [
        OrderedMap(),
        OrderedMap({ a: 123 }),
        OrderedMap({ a: 123, b: 234 })
      ]
      const expected = [
        null,
        [ 123 * 2 ],
        [ 123 * 3, 234 * 3 ]
      ]
      const actual = inputs.map(input => __internals__.getSchemaFromBodyParameters(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationRequestSchemaSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'getSchemaFromBodyParameters')
        .andCall(p => p.valueSeq().get(0) * 2)
      spyOn(__internals__, 'createOperationRequestSchemaAssetSection')
        .andCall(v => v * 3)
      const inputs = [
        new ParameterContainer(),
        new ParameterContainer({
          body: OrderedMap({ a: 123 })
        })
      ]

      const expected = [
        null,
        {
          type: 'list',
          depth: 2,
          value: [
            {
              abstract: true,
              content: [
                'Schema',
                123 * 2 * 3
              ],
              separator: '\n'
            }
          ]
        }
      ]
      const actual = inputs.map(input => __internals__.createOperationRequestSchemaSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationRequestSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createOperationRequestTitleSection').andCall(c => c ? c * 2 : null)
      spyOn(__internals__, 'createOperationRequestHeaderSection')
        .andCall((a, cs, c, m) => a ? a + cs + c + m : null)
      spyOn(__internals__, 'createOperationRequestSchemaSection')
        .andCall(c => c ? c * 3 : null)

      const inputs = [
        [ null, null, null, new Request() ],
        [ null, 234, null, new Request({ method: 456 }) ],
        [ 123, 234, 345, new Request({ method: 456 }) ]
      ]
      const expected = [
        null,
        null,
        {
          type: 'list-item',
          abstract: true,
          content: [
            234 * 2,
            123 + 234 + 345 + 456,
            345 * 3
          ].filter(v => !!v),
          separator: '\n'
        }
      ]
      const actual = inputs.map(input => __internals__.createOperationRequestSection(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationResponseTitleSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'extractContentTypeFromConstraints').andCall(v => v)

      const inputs = [
        [ new Response(), null ],
        [ new Response({ code: 404 }), null ],
        [ new Response({ code: 404 }), 'application/json' ]
      ]
      const expected = [
        {
          type: 'content',
          value: 'Response 200'
        },
        {
          type: 'content',
          value: 'Response 404'
        },
        {
          abstract: true,
          content: [ 'Response ', 404, ' (', 'application/json', ')' ],
          separator: ''
        }
      ]
      const actual = inputs.map(
        input => __internals__.createOperationResponseTitleSection(...input)
      )
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationResponseSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createOperationResponseTitleSection')
        .andCall((r, l) => l.size ? l.toJS().join(',') : null)
      spyOn(__internals__, 'createOperationRequestHeaderSection')
        .andCall((a, cs) => cs.size ? cs.map(v => v * 2).toJS().join(',') : null)
      spyOn(__internals__, 'createOperationRequestSchemaSection')
        .andReturn(456)
      const inputs = [
        [ new Api(), null ],
        [ new Api(), new Response() ],
        [ new Api(), new Response({
          contexts: List([
            new Context({
              constraints: List([ 123, 234, 345 ])
            })
          ])
        }) ]
      ]
      const expected = [
        null,
        {
          type: 'request',
          abstract: true,
          content: [ 456 ],
          separator: '\n'
        },
        {
          type: 'request',
          abstract: true,
          content: [ '123,234,345', '246,468,690', 456 ],
          separator: '\n'
        }
      ]
      const actual = inputs.map(input => __internals__.createOperationResponseSection(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createDefaultResponseSection', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        [ {
          type: 'content',
          value: 'Response 200'
        } ]
      ]
      const actual = inputs.map(input => __internals__.createDefaultResponseSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationResponseSections', () => {
    it('should work', () => {
      spyOn(__internals__, 'createDefaultResponseSection').andReturn([ 123 ])
      spyOn(__internals__, 'createOperationResponseSection')
        .andCall((a, r) => r ? r.get('code') * 2 : null)

      const inputs = [
        [ new Api(), new Request() ],
        [ new Api({
          store: new Store({
            response: OrderedMap({
              '500': new Response({ code: 500 })
            })
          })
        }), new Request({
          responses: OrderedMap({
            '200': new Response({ code: 200 }),
            '404': new Response({ code: 404 }),
            '500': new Reference({ type: 'response', uuid: '500' }),
            '600': new Reference({ type: 'response', uuid: '600' })
          })
        }) ]
      ]
      const expected = [
        [ 123 ],
        [ 400, 808, 1000 ]
      ]
      const actual = inputs.map(input => __internals__.createOperationResponseSections(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationContentSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createOperationParametersSection').andCall(p => p ? p * 2 : null)
      spyOn(__internals__, 'createOperationRequestSection')
        .andCall((a, cs, c, o) => o.get('name') ? o.get('name') * 3 : null)
      spyOn(__internals__, 'createOperationResponseSections')
        .andCall((a, o) => o.get('name') ? [ o.get('name') * 4 ] : [])

      const inputs = [
        [ new Api(), null, new Request() ],
        [ new Api(), 123, new Request({
          name: 200,
          contexts: List([ new Context({ constraints: List([ new Parameter({
            key: 'Content-Type',
            default: 'application/json'
          }) ]) }) ])
        }) ]
      ]
      const expected = [
        null,
        {
          type: 'list',
          depth: 0,
          value: [ 123 * 2, 200 * 3, 200 * 4 ]
        }
      ]

      const actual = inputs.map(input => __internals__.createOperationContentSection(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createOperationSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createOperationTitleSection').andCall(o => o ? o * 2 : null)
      spyOn(__internals__, 'createOperationDescriptionSection').andCall(o => o ? o * 3 : null)
      spyOn(__internals__, 'createOperationContentSection')
        .andCall((a, p, o) => a ? a + p + o : null)

      const inputs = [
        [ null, null, null ],
        [ 123, 234, 345 ]
      ]
      const expected = [
        null,
        {
          type: 'operation',
          abstract: true,
          content: [ 345 * 2, 345 * 3, 123 + 234 + 345 ],
          separator: '\n\n'
        }
      ]
      const actual = inputs.map(input => __internals__.createOperationSection(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createResourceOperationSections', () => {
    it('should work', () => {
      spyOn(__internals__, 'createOperationSection').andCall((a, p, o) => a ? o + p : null)

      const inputs = [
        [ null, new Resource() ],
        [
          123,
          new Resource({
            path: 234,
            methods: OrderedMap({ a: 345, b: 456 })
          })
        ]
      ]
      const expected = [
        [],
        [ 234 + 345, 234 + 456 ]
      ]
      const actual = inputs.map(input => __internals__.createResourceOperationSections(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createResourceSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createResourceTitleSection')
        .andCall((a, r) => a ? a + r : null)
      spyOn(__internals__, 'createResourceDescriptionSection')
        .andCall(r => r * 2)
      spyOn(__internals__, 'createResourceOperationSections')
        .andCall(a => a ? [ a * 2 ] : [])

      const inputs = [
        [ null, null ],
        [ 123, 234 ]
      ]
      const expected = [
        null,
        {
          type: 'resource',
          abstract: true,
          content: [
            123 + 234,
            234 * 2,
            123 * 2
          ].filter(v => !!v),
          separator: '\n\n'
        }
      ]
      const actual = inputs.map(input => __internals__.createResourceSection(...input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createResourceSections', () => {
    it('should work', () => {
      spyOn(__internals__, 'getMergedResourcesBasedOnPathFromApi').andCall(v => v)
      spyOn(__internals__, 'createResourceSection').andCall((a, r) => r * 2)

      const inputs = [
        OrderedMap({ a: 123, b: 234, c: 345 })
      ]
      const expected = [
        [ 123 * 2, 234 * 2, 345 * 2 ]
      ]
      const actual = inputs.map(input => __internals__.createResourceSections(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createResourceGroupSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createResourceGroupHeaderSection')
        .andReturn(123)
      spyOn(__internals__, 'createResourceSections')
        .andCall(a => [ a ])

      const inputs = [
        234
      ]

      const expected = [
        {
          type: 'resourceGroups',
          abstract: true,
          content: [
            123,
            234
          ],
          separator: '\n\n'
        }
      ]
      const actual = inputs.map(input => __internals__.createResourceGroupSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createDataStructuresHeaderSection', () => {
    it('should work', () => {
      const inputs = [
        null
      ]
      const expected = [
        {
          type: 'header',
          depth: 1,
          value: 'Data Structures'
        }
      ]
      const actual = inputs.map(input => __internals__.createDataStructuresHeaderSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createDataStructuresSectionContent', () => {
    it('should work', () => {
      const inputs = [
        { key: 'User', value: {} },
        { key: 'address', value: { type: 'string' } }
      ]
      const expected = [
        {
          abstract: true,
          content: [
            {
              type: 'header',
              depth: 2,
              value: {
                abstract: true,
                content: [
                  'User',
                  ' (',
                  'object',
                  ')'
                ],
                separator: ''
              }
            },
            {
              type: 'asset',
              depth: 2,
              value: {}
            }
          ],
          separator: '\n'
        },
        {
          abstract: true,
          content: [
            {
              type: 'header',
              depth: 2,
              value: {
                abstract: true,
                content: [
                  'address',
                  ' (',
                  'string',
                  ')'
                ],
                separator: ''
              }
            },
            {
              type: 'asset',
              depth: 2,
              value: { type: 'string' }
            }
          ],
          separator: '\n'
        }
      ]
      const actual = inputs.map(input => __internals__.createDataStructuresSectionContent(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createDataStructureSections', () => {
    it('should work', () => {
      spyOn(__internals__, 'createDataStructuresSectionContent')
        .andCall(({ value }) => value.default * 2)

      const inputs = [
        new Api(),
        new Api({
          store: new Store({
            constraint: null
          })
        }),
        new Api({
          store: new Store({
            constraint: OrderedMap({
              a: new Constraint.JSONSchema({ type: 'number', default: 123 }),
              b: new Constraint.JSONSchema({ type: 'number', default: 234 })
            })
          })
        })
      ]
      const expected = [
        [],
        [],
        [ 123 * 2, 234 * 2 ]
      ]

      const actual = inputs.map(input => __internals__.createDataStructureSections(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@createDataStructuresSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createDataStructureSections')
        .andCall(a => a ? [ a * 2 ] : [])
      spyOn(__internals__, 'createDataStructuresHeaderSection')
        .andReturn(234)

      const inputs = [
        null,
        123
      ]
      const expected = [
        null,
        {
          type: 'dataStructures',
          abstract: true,
          content: [ 234, 123 * 2 ],
          separator: '\n\n'
        }
      ]
      const actual = inputs.map(input => __internals__.createDataStructuresSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@convertApiIntoSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'createMetadataSection').andCall(a => a ? a * 2 : null)
      spyOn(__internals__, 'createApiNameAndOverviewSection').andCall(a => a ? a * 3 : null)
      spyOn(__internals__, 'createResourceGroupSection').andCall(a => a ? a * 4 : null)
      spyOn(__internals__, 'createDataStructuresSection').andCall(a => a ? a * 5 : null)

      const inputs = [
        null,
        123
      ]
      const expected = [
        {
          abstract: true,
          content: [],
          separator: '\n\n'
        },
        {
          abstract: true,
          content: [ 123 * 2, 123 * 3, 123 * 4, 123 * 5 ],
          separator: '\n\n'
        }
      ]
      const actual = inputs.map(input => __internals__.convertApiIntoSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@stringifyAbstractSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'stringifySection').andCall(v => v * 2)

      const inputs = [
        { content: [], separator: '**' },
        { content: [ 123, 234 ], separator: '**' }
      ]
      const expected = [
        '',
        '246**468'
      ]
      const actual = inputs.map(input => __internals__.stringifyAbstractSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@stringifyHeaderSection', () => {
    it('should work', () => {
      spyOn(__internals__, 'stringifySection').andCall(v => v * 2)

      const inputs = [
        { value: 123, depth: 1 },
        { value: 234, depth: 3 },
        { value: 234, depth: 0 }
      ]
      const expected = [
        '# 246',
        '### 468',
        '# 468'
      ]
      const actual = inputs.map(input => __internals__.stringifyHeaderSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@stringifyListSection', () => {
    it('should work', () => {
      const inputs = [
        { depth: 0, value: [ 123, 234 ] },
        { depth: 1, value: [ 123, 234 ] },
        { depth: 2, value: [ 123, 234 ] }
      ]
      const expected = [
        '+ 123\n\n' +
        '+ 234',
        '  + 123\n\n' +
        '  + 234',
        '    + 123\n\n' +
        '    + 234'
      ]
      const actual = inputs.map(input => __internals__.stringifyListSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@stringifyAssetSection', () => {
    it('should work', () => {
      const inputs = [
        { value: 'abc', depth: 0 },
        { value: { a: 123 }, depth: 2 }
      ]
      const expected = [
        '```\n' + 'abc' + '\n```',
        '```\n' +
        '    {\n' +
        '      "a": 123\n' +
        '    }' +
        '\n```'
      ]
      const actual = inputs.map(input => __internals__.stringifyAssetSection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@stringifySection', () => {
    it('should work', () => {
      spyOn(__internals__, 'stringifyAbstractSection').andCall(v => v.content * 2)
      spyOn(__internals__, 'stringifyHeaderSection').andCall(v => v.value * 4)
      spyOn(__internals__, 'stringifyListSection').andCall(v => v.value * 5)
      spyOn(__internals__, 'stringifyAssetSection').andCall(v => v.value * 6)

      const inputs = [
        'abc',
        { abstract: true, content: 123 },
        { type: 'content', value: 234 },
        { type: 'header', value: 345 },
        { type: 'list', value: 456 },
        { type: 'asset', value: 567 },
        { type: 'weird', value: 678 }
      ]
      const expected = [
        'abc',
        123 * 2, 234, 345 * 4, 456 * 5, 567 * 6,
        JSON.stringify({ type: 'weird', value: 678 }, null, 2)
      ]
      const actual = inputs.map(input => __internals__.stringifySection(input))
      expect(actual).toEqual(expected)
    })
  })

  describe('@serialize', () => {
    it('should work', () => {
      spyOn(__internals__, 'convertApiIntoSection').andCall(v => v * 2)
      spyOn(__internals__, 'stringifySection').andCall(v => v * 3)

      const inputs = [
        { api: 123 }
      ]
      const expected = [
        123 * 2 * 3 + '\n'
      ]
      const actual = inputs.map(input => __internals__.serialize(input))
      expect(actual).toEqual(expected)
    })
  })
})
