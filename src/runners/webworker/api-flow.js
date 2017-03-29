// TODO fix interface mismatch
import ApiFlow from '../../api-flow'

const methods = {}

methods.postSuccess = (action, extraneous) => {
  return (data) => {
    self.postMessage({
      action,
      success: true,
      result: data,
      ...extraneous
    })
  }
}

methods.postError = (action, extraneous) => {
  return (_error) => {
    let error = _error

    if (_error instanceof Error) {
      error = _error.message || _error.name || 'unknown error'
    }

    self.postMessage({
      action,
      success: false,
      error,
      ...extraneous
    })
  }
}

  // TODO Handle Failures differently from Errors
methods.postFailure = (action, extraneous) => {
  return (_error) => {
    let error = _error

    if (_error instanceof Error) {
      error = _error.message || _error.name || 'unknown error'
    }

    self.postMessage({
      action,
      success: false,
      error,
      ...extraneous
    })
  }
}

methods.extractTransformQuery = (parameters) => {
  const valid = this.validateArguments(parameters)
  if (!valid) {
    return {
      extraneous: parameters
    }
  }

  const {
          content,
          source,
          target,
          ...extraneous
      } = parameters

  const flowOptions = {
    source: {
      name: source.format,
      version: source.version
    },
    target: {
      name: target.format,
      version: target.version
    }
  }

  return {
    query: [ content, flowOptions ],
    extraneous
  }
}

methods.extractDetectFormatQuery = (parameters) => {
  const { content, ...extraneous } = parameters
  return {
    query: [ content ],
    extraneous
  }
}

methods.extractDetectNameQuery = (parameters) => {
  const { content, ...extraneous } = parameters
  return {
    query: [ content ],
    extraneous
  }
}

methods.extractActionAndQuery = (data) => {
  const { action, ...parameters } = data

  const extractorMap = {
    transform: methods.extractTransformQuery
    /*
    detectFormat: ::this.extractDetectFormatQuery,
    detectName: ::this.extractDetectNameQuery
    */
  }

  const extractor = extractorMap[action]

  if (!extractor) {
    return { extraneous: data }
  }

  const { query, ...extraneous } = extractor(parameters)

  if (!query) {
    return { extraneous }
  }

  return { action, query, extraneous }
}

methods.processMessage = (msg) => {
  if (!msg) {
    methods.postError(null, null)('ApiFlow does not accept empty message')
  }

  const { action, query, extraneous } = this.extractActionAndQuery(msg.data)

  if (!action || !query) {
    methods.postError(action, extraneous)('Unrecognized action')
  }
  const actionMap = {
    transform: ApiFlow.transform
    /*
    detectName: ::this.detectName,
    detectFormat: ::this.detectFormat
    */
  }

  const actor = actionMap[action]
  if (!actor) {
    // TODO send message about internal conflict
    const error = 'Internal Error: ' +
                  'ApiFlow did not find any actors for this action ' +
                  'despite validating the action. This should not happen'
    return methods.postFailure(action, extraneous)(error)
  }

  const promise = actor(...query)

  promise
    .then(methods.postSuccess(action, extraneous), methods.postError(action, extraneous))
    .catch(methods.postFailure(action, extraneous))
}

self.onmessage = function() {
  methods.processMessage(arguments)
}

export default ApiFlow
