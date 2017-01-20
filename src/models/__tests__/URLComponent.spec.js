/* eslint-disable max-nested-callbacks */
import { Record, List } from 'immutable'
import expect, { spyOn, restoreSpies } from 'expect'

import { URLComponent, __internals__ } from '../URLComponent'
import Parameter from '../Parameter'
import Constraint from '../Constraint'

describe('models/URLComponent.js', () => {
  afterEach(() => restoreSpies())
  describe('{ URLComponent }', () => {
    it('should be a Record', () => {
      const instance = new URLComponent()

      expect(instance).toBeA(Record)
    })

    describe('#fields', () => {
      it('should have a `componentName` field', () => {
        const componentName = 'test'
        const data = { componentName }

        const instance = new URLComponent(data)

        expect(instance.get('componentName')).toEqual(componentName)
      })

      it('should have a `string` field', () => {
        const string = 'test'
        const data = { string }

        const instance = new URLComponent(data)

        expect(instance.get('string')).toEqual(string)
      })

      it('should have a `parameter` field', () => {
        const parameter = 'test'
        const data = { parameter }

        const instance = new URLComponent(data)

        expect(instance.get('parameter')).toEqual(parameter)
      })

      it('should have a `variableDelimiters` field', () => {
        const variableDelimiters = 'test'
        const data = { variableDelimiters }

        const instance = new URLComponent(data)

        expect(instance.get('variableDelimiters')).toEqual(variableDelimiters)
      })
    })

    describe('-methods', () => {
      describe('@addConstraint', () => {
        it('should call __internals__.addConstraintToURLComponent', () => {
          const expected = 123141
          spyOn(__internals__, 'addConstraintToURLComponent').andReturn(expected)

          const component = new URLComponent()
          const actual = component.addConstraint()

          expect(actual).toEqual(expected)
          expect(__internals__.addConstraintToURLComponent).toHaveBeenCalled()
        })

        it('should call __internals__.addConstraintToURLComponent with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'addConstraintToURLComponent').andReturn(expected)

          const component = new URLComponent()
          const actual = component.addConstraint(true)

          expect(actual).toEqual(expected)
          expect(__internals__.addConstraintToURLComponent).toHaveBeenCalled(component, true)
        })
      })

      describe('@generate', () => {
        it('should call __internals__.generateURLComponent', () => {
          const expected = 123141
          spyOn(__internals__, 'generateURLComponent').andReturn(expected)

          const component = new URLComponent()
          const actual = component.generate()

          expect(actual).toEqual(expected)
          expect(__internals__.generateURLComponent).toHaveBeenCalled()
        })

        it('should call __internals__.generateURLComponent with correct arguments', () => {
          const expected = 123141
          spyOn(__internals__, 'generateURLComponent').andReturn(expected)

          const delimiters = List([ 1, 2 ])
          const component = new URLComponent()
          const actual = component.generate(delimiters, true)

          expect(actual).toEqual(expected)
          expect(__internals__.generateURLComponent).toHaveBeenCalled(component, delimiters, true)
        })
      })
    })
  })

  describe('@convertSimpleStringToParameter', () => {
    it('should return a Parameter', () => {
      const actual = __internals__.convertSimpleStringToParameter()

      expect(actual).toBeA(Parameter)
    })

    it('should return expected Parameter', () => {
      const key = 'test'
      const value = '42'

      const expected = new Parameter({
        key: 'test',
        name: 'test',
        default: '42',
        type: 'string'
      })
      const actual = __internals__.convertSimpleStringToParameter(key, value)

      expect(actual).toEqual(expected)
    })
  })

  describe('@sectionMapper', () => {
    it('should call convertSimpleStringToParameter', () => {
      spyOn(__internals__, 'convertSimpleStringToParameter').andReturn(1234)

      const section = '4321'
      const index = 0
      __internals__.sectionMapper(section, index)

      expect(__internals__.convertSimpleStringToParameter).toHaveBeenCalled()
    })

    it('should set key to section only if index is odd', () => {
      spyOn(__internals__, 'convertSimpleStringToParameter').andReturn(1234)

      const section = '4321'

      // random even index
      let index = Math.floor(Math.random() * 2000) * 2
      __internals__.sectionMapper(section, index)
      expect(__internals__.convertSimpleStringToParameter).toHaveBeenCalledWith(null, section)

      // random odd index
      index = Math.floor(Math.random() * 2000) * 2 + 1
      __internals__.sectionMapper(section, index)
      expect(__internals__.convertSimpleStringToParameter).toHaveBeenCalledWith(section, section)
    })
  })

  describe('@extractSectionsFromString', () => {
    it('should work with no variables in string', () => {
      const string = '/a/simple/path'
      const delimiters = List([ '{', '}' ])

      const expected = [ string ]
      const actual = __internals__.extractSectionsFromString(string, delimiters)

      expect(actual).toEqual(expected)
    })

    it('should work with variables in string', () => {
      const string = '/a/{userId}/path/{pathId}'
      const delimiters = List([ '{', '}' ])

      const expected = [ '/a/', 'userId', '/path/', 'pathId', '' ]
      const actual = __internals__.extractSectionsFromString(string, delimiters)

      expect(actual).toEqual(expected)
    })

    it('should work with poorly formatted string', () => {
      const string = '/a/we}ird/{path/'
      const delimiters = List([ '{', '}' ])

      const expected = [ string ]
      const actual = __internals__.extractSectionsFromString(string, delimiters)

      expect(actual).toEqual(expected)
    })

    it('should always start with a non-variable string', () => {
      const string = '{userId}/path/{pathId}'
      const delimiters = List([ '{', '}' ])

      const expected = [ '', 'userId', '/path/', 'pathId', '' ]
      const actual = __internals__.extractSectionsFromString(string, delimiters)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertComplexStringToSequenceParameter', () => {
    it('should return a SequenceParameter if path has variable', () => {
      const key = 'pathname'
      const string = '/a/simple/{path}'
      const delimiters = List([ '{', '}' ])

      const actual = __internals__.convertComplexStringToSequenceParameter(key, string, delimiters)

      expect(actual).toBeA(Parameter)
      expect(actual.get('superType')).toEqual('sequence')
    })

    it('should return a standard parameter if path has no variable', () => {
      const key = 'pathname'
      const string = '/a/simple/path'
      const delimiters = List([ '{', '}' ])

      const actual = __internals__.convertComplexStringToSequenceParameter(key, string, delimiters)

      expect(actual).toBeA(Parameter)
      expect(actual.get('superType')).toEqual(null)
    })

    it('should call extractSectionsFromString', () => {
      spyOn(__internals__, 'extractSectionsFromString').andReturn([])

      const key = 'pathname'
      const string = '/a/simple/path'
      const delimiters = List([ '{', '}' ])
      __internals__.convertComplexStringToSequenceParameter(key, string, delimiters)

      expect(__internals__.extractSectionsFromString).toHaveBeenCalledWith(string, delimiters)
    })

    it('should call sectionMapper for each extracted section', () => {
      spyOn(__internals__, 'extractSectionsFromString').andReturn([ '/a/', '{userId}', '/path' ])
      spyOn(__internals__, 'sectionMapper').andReturn([])

      const key = 'pathname'
      const string = '/a/{userId}/path'
      const delimiters = List([ '{', '}' ])
      __internals__.convertComplexStringToSequenceParameter(key, string, delimiters)

      expect(__internals__.sectionMapper.calls.length).toEqual(3)
    })

    it('should work', () => {
      const key = 'pathname'
      const string = '/a/{userId}/path'
      const delimiters = List([ '{', '}' ])

      const expected = new Parameter({
        key: 'pathname',
        name: 'pathname',
        type: 'string',
        superType: 'sequence',
        value: List([
          new Parameter({
            type: 'string',
            default: '/a/'
          }),
          new Parameter({
            key: 'userId',
            name: 'userId',
            type: 'string',
            default: 'userId'
          }),
          new Parameter({
            type: 'string',
            default: '/path'
          })
        ])
      })

      const actual = __internals__.convertComplexStringToSequenceParameter(key, string, delimiters)

      expect(actual).toEqual(expected)
    })

    it('should work with no variables', () => {
      const key = 'pathname'
      const string = '/a/simple/path'
      const delimiters = List([ '{', '}' ])

      const expected = new Parameter({
        key: 'pathname',
        name: 'pathname',
        type: 'string',
        default: '/a/simple/path'
      })

      const actual = __internals__.convertComplexStringToSequenceParameter(key, string, delimiters)

      expect(actual).toEqual(expected)
    })
  })

  describe('@convertStringToParameter', () => {
    it('should call convertSimpleStringToParameter if no delimiters', () => {
      spyOn(__internals__, 'convertSimpleStringToParameter').andReturn(321)

      const key = 'pathname'
      const string = '/a/{userId}/path'
      __internals__.convertStringToParameter(key, string)

      expect(__internals__.convertSimpleStringToParameter).toHaveBeenCalledWith(key, string)
    })

    it('should call convertSimpleStringToParameter if delimiters', () => {
      spyOn(__internals__, 'convertComplexStringToSequenceParameter').andReturn(321)

      const key = 'pathname'
      const string = '/a/{userId}/path'
      const delimiters = List([ '%' ])
      __internals__.convertStringToParameter(key, string, delimiters)

      expect(__internals__.convertComplexStringToSequenceParameter).toHaveBeenCalledWith(
        key,
        string,
        delimiters
      )
    })
  })

  describe('@addConstraintToURLComponent', () => {
    it('should call convertStringToParameter if no parameter in component', () => {
      const param = new Parameter({
        key: 'someKey'
      })
      spyOn(__internals__, 'convertStringToParameter').andReturn(param)

      const component = new URLComponent()
      const constraint = new Constraint.Enum([ '123', '321' ])
      __internals__.addConstraintToURLComponent(component, constraint)

      expect(__internals__.convertStringToParameter).toHaveBeenCalled()
    })

    it('should add constraint to parameter', () => {
      const param = new Parameter({
        key: 'someKey'
      })
      const component = new URLComponent({
        parameter: param
      })
      const constraint = new Constraint.Enum([ '123', '321' ])

      const expected = new URLComponent({
        parameter: new Parameter({
          key: 'someKey',
          constraints: List([ constraint ])
        })
      })
      const actual = __internals__.addConstraintToURLComponent(component, constraint)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addHandlesToVariable', () => {
    it('should work with single delimiters', () => {
      const variable = 'userId'
      const delimiters = List([ '%' ])

      const expected = '%userId%'
      const actual = __internals__.addHandlesToVariable(variable, delimiters)

      expect(actual).toEqual(expected)
    })

    it('should work with couple delimiters', () => {
      const variable = 'userId'
      const delimiters = List([ '{', '}' ])

      const expected = '{userId}'
      const actual = __internals__.addHandlesToVariable(variable, delimiters)

      expect(actual).toEqual(expected)
    })
  })

  describe('@addVarHandlesToVariablesInSequenceParameter', () => {
    it('should call addHandlesToVariable for each variable', () => {
      spyOn(__internals__, 'addHandlesToVariable').andReturn('handled')

      const param = new Parameter({
        type: 'string',
        superType: 'sequence',
        key: 'someKey',
        name: 'someKey',
        value: List([
          new Parameter({ type: 'string', default: '/path/' }),
          new Parameter({ key: 'pathId', name: 'pathId', type: 'string', default: 'pathId' }),
          new Parameter({ type: 'string', default: '/users/' }),
          new Parameter({ key: 'userId', name: 'userId', type: 'string', default: 'userId' }),
          new Parameter({ type: 'string', default: '/path/' })
        ])
      })
      const delimiters = List([ '{', '}' ])

      __internals__.addVarHandlesToVariablesInSequenceParameter(param, delimiters)

      expect(__internals__.addHandlesToVariable.calls.length).toEqual(2)
      expect(__internals__.addHandlesToVariable.calls[0].arguments).toEqual([
        'pathId', delimiters
      ])
      expect(__internals__.addHandlesToVariable.calls[1].arguments).toEqual([
        'userId', delimiters
      ])
    })

    it('should work', () => {
      const param = new Parameter({
        type: 'string',
        superType: 'sequence',
        key: 'someKey',
        name: 'someKey',
        value: List([
          new Parameter({ type: 'string', default: '/path/' }),
          new Parameter({ key: 'pathId', name: 'pathId', type: 'string', default: 'pathId' }),
          new Parameter({ type: 'string', default: '/users/' }),
          new Parameter({ key: 'userId', name: 'userId', type: 'string', default: 'userId' }),
          new Parameter({ type: 'string', default: '/path/' })
        ])
      })
      const delimiters = List([ '{', '}' ])

      const expected = new Parameter({
        type: 'string',
        superType: 'sequence',
        key: 'someKey',
        name: 'someKey',
        value: List([
          new Parameter({ type: 'string', default: '/path/' }),
          new Parameter({ key: 'pathId', name: 'pathId', type: 'string', default: '{pathId}' }),
          new Parameter({ type: 'string', default: '/users/' }),
          new Parameter({ key: 'userId', name: 'userId', type: 'string', default: '{userId}' }),
          new Parameter({ type: 'string', default: '/path/' })
        ])
      })
      const actual = __internals__.addVarHandlesToVariablesInSequenceParameter(param, delimiters)

      expect(actual).toEqual(expected)
    })
  })

  describe('@generateURLComponent', () => {
    it('should call addVarHandles... if param is sequence and variableDelimiters exists', () => {
      const parameter = new Parameter({
        type: 'string',
        superType: 'sequence'
      })

      spyOn(parameter, 'generate').andReturn('some/string/')
      spyOn(__internals__, 'addVarHandlesToVariablesInSequenceParameter').andReturn(parameter)

      const variableDelimiters = List([ '%' ])
      const urlComponent = new URLComponent({ parameter })

      __internals__.generateURLComponent(urlComponent, variableDelimiters)

      expect(__internals__.addVarHandlesToVariablesInSequenceParameter).toHaveBeenCalled()
    })

    it('should not call addVarHandles... if param is not sequence', () => {
      const parameter = new Parameter({
        type: 'string'
      })

      spyOn(parameter, 'generate').andReturn('some/string/')
      spyOn(__internals__, 'addVarHandlesToVariablesInSequenceParameter').andReturn(parameter)

      const variableDelimiters = List([ '%' ])
      const urlComponent = new URLComponent({ parameter })

      __internals__.generateURLComponent(urlComponent, variableDelimiters)

      expect(__internals__.addVarHandlesToVariablesInSequenceParameter).toNotHaveBeenCalled()
    })

    it('should not call addVarHandles... if no variableDelimiters', () => {
      const parameter = new Parameter({
        type: 'string',
        superType: 'sequence'
      })

      spyOn(parameter, 'generate').andReturn('some/string/')
      spyOn(__internals__, 'addVarHandlesToVariablesInSequenceParameter').andReturn(parameter)

      const urlComponent = new URLComponent({ parameter })

      __internals__.generateURLComponent(urlComponent)

      expect(__internals__.addVarHandlesToVariablesInSequenceParameter).toNotHaveBeenCalled()
    })

    it('should work', () => {
      const parameter = new Parameter({
        type: 'string',
        superType: 'sequence',
        value: List([
          new Parameter({
            type: 'string', default: '/users/'
          }),
          new Parameter({
            key: 'userId', name: 'userId',
            type: 'string', default: 'userId'
          }),
          new Parameter({
            type: 'string', default: ''
          })
        ])
      })

      const urlComponent = new URLComponent({ parameter })
      const delimiters = List([ '{{', '}}' ])

      const expected = '/users/{{userId}}'
      const actual = __internals__.generateURLComponent(urlComponent, delimiters)

      expect(actual).toEqual(expected)
    })
  })
})
