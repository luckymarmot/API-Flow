import { Record, List } from 'immutable'

import Model from './ModelInfo'

import {
    Parameter
} from './Parameter'

/**
 * Metadata about the URLComponent Record.
 * Used for internal serialization and deserialization
 */
const modelInstance = {
  name: 'url-component.models',
  version: '0.1.0'
}
const model = new Model(modelInstance)

/**
 * Default Spec for the URLComponent Record.
 */
const URLComponentSpec = {
  _model: model,
  componentName: null,
  string: null,
  parameter: null,
  variableDelimiters: List()
}

/**
 * Holds all the internal methods used in tandem with a URLComponent
 */
const methods = {}

/**
 * The URLComponent Record
 */
export class URLComponent extends Record(URLComponentSpec) {
  constructor(component) {
    if (component && component.string && !component.parameter) {
      component.parameter = methods.convertStringToParameter(
        component.componentName,
        component.string,
        component.variableDelimiters
      )
    }

    super(component)
    return this
  }

  addConstraint(constraint) {
    return methods.addConstraintToURLComponent(this, constraint)
  }

  generate(variableDelimiters = List(), useDefault = true) {
    return methods.generateURLComponent(this, variableDelimiters, useDefault)
  }
}

/**
 * creates a simple Parameter from a key, value pair
 * @param {string} key: the key of the pair
 * @param {string} value: the value of the pair
 * @returns {Parameter} the corresponding Parameter
 */
methods.convertSimpleStringToParameter = (key = null, value) => {
  return new Parameter({
    key,
    name: key,
    type: 'string',
    default: value
  })
}

/**
 * a Map function to convert a string in a Parameter based on its index in the array.
 * A Parameter without a key is simply a string waiting to be generated, while a Parameter with a
 * key is a `variable` that could be referred to. We assume that the array is an alternating list of
 * var/non-var elements, starting with a non-var string
 * @param {string} section: the string to convert to a Parameter
 * @param {string} index: the index in the array of the string
 * @returns {Parameter} the corresponding Parameter
 */
methods.sectionMapper = (section, index) => {
  const key = index % 2 ? section : null
  return methods.convertSimpleStringToParameter(key, section)
}

/**
 * transforms a string into a List<string> based on the variable delimiters
 * @param {string} string: the string to split
 * @param {List<string>} delimiters: the variable delimiters used to separate variables from
 * non-variables. like List([ '{{', '}}' ])
 * @returns {List<string>} the list containing all the variable/non-variable strings, in order
 */
methods.extractSectionsFromString = (string, delimiters) => {
  const regex = new RegExp(delimiters.join('(.+?)'))
  return string.split(regex)
}

/**
 * converts a url component into a SequenceParameter, with its variables extracted based on
 * the delimiters provided
 * @param {string} key: the type of URL component (hostname, pathname, etc.)
 * @param {string} string: the string to transform into a sequence
 * @param {List<string>} delimiters: the variable delimiters. like List([ '{{', '}}' ])
 * @returns {Parameter} the corresponding Parameter
 */
methods.convertComplexStringToSequenceParameter = (key, string, delimiters) => {
  const sections = methods.extractSectionsFromString(string, delimiters)
  const sequence = sections.map(methods.sectionMapper)

  if (sequence.length === 1) {
    return sequence[0]
      .set('key', key)
      .set('name', key)
  }

  return new Parameter({
    key,
    name: key,
    type: 'string',
    superType: 'sequence',
    value: List(sequence)
  })
}

/**
 * converts a url component into a Parameter, with its variables extracted based on
 * the delimiters provided
 * @param {string} key: the type of URL component (hostname, pathname, etc.)
 * @param {string} string: the string to transform into a Parameter
 * @param {List<string>} delimiters: the variable delimiters. like List([ '{{', '}}' ])
 * @returns {Parameter} the corresponding Parameter
 */
methods.convertStringToParameter = (key, string, delimiters = List()) => {
  if (delimiters.size === 0) {
    return methods.convertSimpleStringToParameter(key, string)
  }

  return methods.convertComplexStringToSequenceParameter(key, string, delimiters)
}

/**
 * adds a constraint to the parameter of a URLComponent
 * @param {URLComponent} urlComponent: the URLComponent to update
 * @param {Constraint} constraint: the constraint to add
 * @returns {URLComponent} the updated URLComponent
 */
methods.addConstraintToURLComponent = (urlComponent, constraint) => {
  let parameter = urlComponent.get('parameter')
  if (!parameter) {
    parameter = methods.convertStringToParameter(
      urlComponent.get('componentName'),
      urlComponent.get('string'),
      urlComponent.get('variableDelimiters')
    )
  }
  let constraints = parameter.get('constraints')

  constraints = constraints.push(constraint)
  parameter = parameter.set('constraints', constraints)
  return urlComponent.set('parameter', parameter)
}

/**
 * wraps a variable with handles.
 * @param {string} variable: the variable to wrap
 * @param {List<string>} delimiters: the variable delimiters. like List([ '{{', '}}' ])
 * @returns {string} the wrapped variable
 */
methods.addHandlesToVariable = (variable, delimiters) => {
  const handles = List([
    delimiters.get(0),
    typeof delimiters.get(1) !== 'undefined' ? delimiters.get(1) : delimiters.get(0)
  ])

  return handles.join(variable)
}

/**
 * wraps with handles all variables in the sequence of a SequenceParameter.
 * @param {Parameter} param: the SequenceParameter to update
 * @param {List<string>} delimiters: the variable delimiters. like List([ '{{', '}}' ])
 * @returns {Parameter} the updated Parameter
 */
methods.addVarHandlesToVariablesInSequenceParameter = (param, delimiters) => {
  const sequence = param.get('value')
  const sequenceWithVars = sequence.map((section, index) => {
    if (index % 2 === 0) {
      return section
    }

    const variable = methods.addHandlesToVariable(section.get('key'), delimiters)
    return section.set('default', variable)
  })

  return param.set('value', sequenceWithVars)
}

/**
 * generates a string representing a URLComponent, with variables wrapped based on the
 * variableDelimiters.
 * @param {URLComponent} urlComponent: the URLComponent to transform in a string
 * @param {List<string>} variableDelimiters: the variable delimiters. like List([ '{{', '}}' ])
 * @param {boolean} useDefault: whether to use the default value or to generate from the JSON schema
 * @returns {Parameter} the updated Parameter
 */
methods.generateURLComponent = (urlComponent, variableDelimiters = List(), useDefault = true) => {
  let parameter = urlComponent.get('parameter')
  if (variableDelimiters.size !== 0 && parameter.get('superType') === 'sequence') {
    parameter = methods.addVarHandlesToVariablesInSequenceParameter(parameter, variableDelimiters)
  }

  return parameter.generate(useDefault)
}

export const __internals__ = methods
export default URLComponent
