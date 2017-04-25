/**
 * This is a template to help speed up the writing of a parser.
 *
 * A Parser converts a standardized file that describe an Api according to a certain format into the
 * internal model of API-Flow. If you want to learn more about the internal model, you can find more
 * information in `src/README.md`
 *
 * This template follows a very simple strategy that is not necessarily the best nor the most
 * elegant but yields decent implementation results. The strategy is to try to follow as closely as
 * possible the model in which the conversion should be done, which for a Parser is the internal
 * model, and to pass along all the necessary parts of the source model to create the components
 * of the target model. For example, if your model separates responses from requests in a resource
 * layer, then these responses would be passed along for the creation of Requests, as Responses
 * are a nested component of Request in the internal model.
 *
 * We found that working against the target model instead of from the source model yielded fewer
 * bugs than the opposite. This is, however, just a recommendation.
 */
import { OrderedMap, List } from 'immutable'
import { convertEntryListInMap } from '../../../utils/fp-utils'

import Api from '../../../models/Api'
import Info from '../../../models/Info'
import Group from '../../../models/Group'
import Store from '../../../models/Store'
import Reference from '../../../models/Reference'
import Resource from '../../../models/Resource'
import ParameterContainer from '../../../models/ParameterContainer'
import Auth from '../../../models/Auth'
import Request from '../../../models/Request'

const methods = {}

export const __meta__ = {
  version: 'v1.0',
  format: 'template'
}

export class TemplateParser {
  static __meta__ = __meta__

  static detect(content) {
    return methods.detect(content)
  }

  static getAPIName(content) {
    return methods.getAPIName(content)
  }

  static parse() {
    return methods.parse(...arguments)
  }
}

/**
 * evaluates if the file is parsable by giving a score to the file depending on a few criteria.
 * @param {string} content: the content of the file to evaluate
 * @returns {number} the corresponding score, between 0 and 1
 */
methods.detect = (content) => {
  const detection = {
    format: __meta__.format,
    version: __meta__.version,
    score: 0
  }

  try {
    const json = JSON.parse(content)
    if (!json.info || !json.item) {
      return [ detection ]
    }

    if (!json.info.name || !json.info.schema) {
      return [ detection ]
    }

    detection.score = 1
    return [ detection ]
  }
  catch (e) {
    return [ detection ]
  }
}

/**
 * tries to extract a title from a RAML file
 * @param {string} content: the file to get the api title from
 * @returns {string?} the title, if it was found
 */
methods.getAPIName = (content) => {
  try {
    const json = JSON.parse(content)
    if (!json.info || !json.item) {
      return null
    }

    if (!json.info.name || !json.info.schema) {
      return null
    }

    return json.info.name || null
  }
  catch (e) {
    return null
  }
}

// ** BEGIN INFO **
/**
 * extracts an Info `title` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `title` field.
 * @returns {{key: 'title', value: string}?} the corresponding title field, as a key-value pair
 */
methods.extractInfoTitle = () => null

/**
 * extracts an Info `description` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `description` field.
 * @returns {{key: 'description', value: string}?} the corresponding description field, as a
 * key-value pair
 */
methods.extractInfoDescription = () => null

/**
 * extracts an Info `termsOfService` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `termsOfService` field.
 * @returns {{key: 'termsOfService', value: string}?} the corresponding termsOfService field, as a
 * key-value pair
 */
methods.extractInfoTermsOfService = () => null

/**
 * extracts an Info `contact` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `contact` field.
 * @returns {{key: 'contact', value: Contact}?} the corresponding contact field, as a key-value
 * pair
 *
 * Note that the contact field should be a Contact Record if it exists
 */
methods.extractInfoContact = () => null

/**
 * extracts an Info `license` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `license` field.
 * @returns {{key: 'license', value: Contact}?} the corresponding license field, as a key-value
 * pair
 *
 * Note that the license field should be a License Record if it exists
 */
methods.extractInfoLicense = () => null

/**
 * extracts an Info `version` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `version` field.
 * @returns {{key: 'version', value: string}?} the corresponding version field, as a key-value pair
 *
 * Note that this refers to the version of the Api that is being converted, not the version of the
 * parser used to parse it.
 */
methods.extractInfoVersion = () => null

/**
 * creates all the fields that are needed to fully construct an Info Record.
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of an
 * Info Record.
 * @returns {InfoInstance} an object holding all the information necessary to the instantiation of
 * an Info Record.
 */
methods.extractInfoInstance = (itemOrSubItem) => {
  const kvs = [
    methods.extractInfoTitle(itemOrSubItem),
    methods.extractInfoDescription(itemOrSubItem),
    methods.extractInfoTermsOfService(itemOrSubItem),
    methods.extractInfoContact(itemOrSubItem),
    methods.extractInfoLicense(itemOrSubItem),
    methods.extractInfoVersion(itemOrSubItem)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

/**
 * extracts an Api `info` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `info` field.
 * @returns {{key: 'info', value: Info}} the corresponding info field, as a key-value
 * pair
 *
 * Note that the info field should be an Info Record
 */
methods.extractInfo = (itemOrSubItem) => {
  const infoInstance = methods.extractInfoInstance(itemOrSubItem)

  return { key: 'info', value: new Info(infoInstance) }
}
// ** END INFO **

// ** BEGIN GROUP **
/**
 * extracts a Group `id` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of an
 * `id` field.
 * @returns {{ key: 'id', value: (string|number) }?} the corresponding id field, as a key-value pair
 */
methods.extractGroupId = () => null

/**
 * extracts a Group `name` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `name` field.
 * @returns {{key: 'name', value: string}?} the corresponding name field, as a key-value pair
 */
methods.extractGroupName = () => null

/**
 * extracts a Group `description` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `description` field.
 * @returns {{key: 'description', value: string}?} the corresponding description field, as a
 * key-value pair
 */
methods.extractGroupDescription = () => null

/**
 * extracts a Group `children` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `children` field.
 * @returns {{key: 'chidren', value: OrderedMap<string, string|Group>}} the corresponding children
 * field, as a key-value pair
 *
 * Note that children must be an OrderedMap of ids (string) to either resourceIds (string) or
 * sub-groups (Groups).
 */
methods.extractGroupChildren = () => null

/**
 * creates all the fields that are needed to fully construct a Group Record.
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * Group Record.
 * @returns {GroupInstance} an object holding all the information necessary to the instantiation of
 * a Group Record.
 */
methods.extractGroupInstance = (itemOrSubItem) => {
  const kvs = [
    methods.extractGroupId(itemOrSubItem),
    methods.extractGroupName(itemOrSubItem),
    methods.extractGroupDescription(itemOrSubItem),
    methods.extractGroupChildren(itemOrSubItem)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

/**
 * extracts an Api `group` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `group` field.
 * @returns {{key: 'group', value: Group}} the corresponding group field, as a key-value
 * pair
 *
 * Note that the group field should be a Group Record
 */
methods.extractGroup = (itemOrSubItem) => {
  const groupInstance = methods.extractGroupInstance(itemOrSubItem)

  return { key: 'group', value: new Group(groupInstance) }
}
// ** END GROUP **

// ** BEGIN STORE **
/**
 * extracts a shared aws-v4 auth as a key-value entry
 * @param {ItemPart} auth - a part of the file that is relevant to the extraction of an aws-v4 auth.
 * @returns {{key: string, value: AWSSig4Auth}} the corresponding auth, as a key-value pair
 *
 * Note that the key should be a uniquely identifying value. It is recommended that it be identical
 * to the authName field in the Auth Record
 */
methods.extractSharedAWSSig4AuthFromAuth = (auth) => {
  const key = auth.unique_identifying_key
  const auth_name = auth.auth_name || auth.unique_indentifying_key
  const settings = auth.settings
  return {
    key: key,
    value: new Auth.AWSSig4({
      authName: auth_name,
      key: settings.key || null,
      secret: settings.secret || null,
      region: settings.region || null,
      service: settings.service || null
    })
  }
}

/**
 * extracts a shared basic auth as a key-value entry
 * @param {ItemPart} auth - a part of the file that is relevant to the extraction of an basic auth.
 * @returns {{key: string, value: BasicAuth}} the corresponding auth, as a key-value pair
 *
 * Note that the key should be a uniquely identifying value. It is recommended that it be identical
 * to the authName field in the Auth Record
 */
methods.extractSharedBasicAuthFromAuth = (auth) => {
  const key = auth.unique_identifying_key
  const auth_name = auth.auth_name || auth.unique_indentifying_key
  const settings = auth.settings
  return {
    key: key,
    value: new Auth.Basic({
      authName: auth_name,
      username: settings.username || null,
      password: settings.password || null
    })
  }
}

/**
 * extracts a shared digest auth as a key-value entry
 * @param {ItemPart} auth - a part of the file that is relevant to the extraction of a digest auth.
 * @returns {{key: string, value: DigestAuth}} the corresponding auth, as a key-value pair
 *
 * Note that the key should be a uniquely identifying value. It is recommended that it be identical
 * to the authName field in the Auth Record
 */
methods.extractSharedDigestAuthFromAuth = (auth) => {
  const key = auth.unique_identifying_key
  const auth_name = auth.auth_name || auth.unique_indentifying_key
  const settings = auth.settings
  return {
    key: key,
    value: new Auth.Digest({
      authName: auth_name,
      username: settings.username || null,
      password: settings.password || null
    })
  }
}

/**
 * extracts a shared hawk auth as a key-value entry
 * @param {ItemPart} auth - a part of the file that is relevant to the extraction of a hawk auth.
 * @returns {{key: string, value: HawkAuth}} the corresponding auth, as a key-value pair
 *
 * Note that the key should be a uniquely identifying value. It is recommended that it be identical
 * to the authName field in the Auth Record
 */
methods.extractSharedHawkAuthFromAuth = (auth) => {
  const key = auth.unique_identifying_key
  const auth_name = auth.auth_name || auth.unique_indentifying_key
  const settings = auth.settings
  return {
    key: key,
    value: new Auth.Hawk({
      authName: auth_name,
      id: settings.id || null,
      key: settings.key || null,
      algorithm: settings.algorithm || null
    })
  }
}

/**
 * extracts a shared OAuth1 auth as a key-value entry
 * @param {ItemPart} auth - a part of the file that is relevant to the extraction of an OAuth1 auth.
 * @returns {{key: string, value: OAuth1Auth}} the corresponding auth, as a key-value pair
 *
 * Note that the key should be a uniquely identifying value. It is recommended that it be identical
 * to the authName field in the Auth Record
 */
methods.extractSharedOAuth1AuthFromAuth = (auth) => {
  const key = auth.unique_identifying_key
  const auth_name = auth.auth_name || auth.unique_indentifying_key
  const settings = auth.settings
  return {
    key: key,
    value: new Auth.OAuth1({
      authName: auth_name,
      consumerSecret: settings.consumerSecret || null,
      consumerKey: settings.consumerKey || null,
      token: settings.token || null,
      tokenSecret: settings.tokenSecret || null
    })
  }
}

/**
 * extracts a shared OAuth2 auth as a key-value entry
 * @param {ItemPart} auth - a part of the file that is relevant to the extraction of an OAuth2 auth.
 * @returns {{key: string, value: OAuth2Auth}} the corresponding auth, as a key-value pair
 *
 * Note that the key should be a uniquely identifying value. It is recommended that it be identical
 * to the authName field in the Auth Record
 */
methods.extractSharedOAuth2AuthFromAuth = (auth) => {
  const key = auth.unique_identifying_key
  const auth_name = auth.auth_name || auth.unique_indentifying_key
  const settings = auth.settings
  return {
    key: key,
    value: new Auth.OAuth2({
      authName: auth_name,
      authorizationUrl: settings.authorizationUrl || null,
      tokenUrl: settings.tokenUrl || null
    })
  }
}

/* eslint-disable max-statements */
/**
 * extracts a shared auth as a key-value entry
 * @param {ItemPart} auth - a part of the file that is relevant to the extraction of an auth.
 * @returns {{key: string, value: Auth}} the corresponding auth, as a key-value pair
 *
 * Note that the key should be a uniquely identifying value. It is recommended that it be identical
 * to the authName field in the Auth Record
 */
methods.extractSharedAuthFromItemAuth = (auth) => {
  if (auth.type === 'awsv4') {
    return methods.extractSharedAWSSig4AuthFromAuth(auth)
  }

  if (auth.type === 'basic') {
    return methods.extractSharedBasicAuthFromAuth(auth)
  }

  if (auth.type === 'digest') {
    return methods.extractSharedDigestAuthFromAuth(auth)
  }

  if (auth.type === 'hawk') {
    return methods.extractSharedHawkAuthFromAuth(auth)
  }

  if (auth.type === 'oauth1') {
    return methods.extractSharedOAuth1AuthFromAuth(auth)
  }

  if (auth.type === 'oauth2') {
    return methods.extractSharedOAuth2AuthFromAuth(auth)
  }

  if (auth.type === 'noauth') {
    return null
  }

  return null
}
/* eslint-enable max-statements */

/**
 * extracts all shared auth as a key-value pair for a TypedStore (aka OrderedMap)
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of
 * shared auths.
 * @returns {{key: 'auth', value: OrderedMap<string, Auth>}} the corresponding TypedStore, as a
 * key-value pair.
 */
methods.extractAuthTypedStore = (itemOrSubItem) => {
  const auths = itemOrSubItem.auths
    .map(methods.extractSharedAuthFromItemAuth)
    .filter(v => !!v)
    .reduce(convertEntryListInMap, {})

  return { key: 'auth', value: OrderedMap(auths) }
}

/**
 * extracts a shared parameter as a key-value entry
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * parameter.
 * @returns {{key: string, value: Parameter}} the corresponding parameter, as a key-value pair
 *
 * Note that the key should be a uniquely identifying value.
 */
methods.extractSharedParameterFromItemParameter = () => null

/**
 * extracts all shared parameters as a key-value pair for a TypedStore (aka OrderedMap)
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of
 * shared parameters.
 * @returns {{key: 'parameter', value: OrderedMap<string, Parameter>}} the corresponding TypedStore,
 * as a key-value pair.
 */
methods.extractParameterTypedStore = (itemOrSubItem) => {
  const parameters = itemOrSubItem.parameters
    .map(methods.extractSharedParameterFromItemParameter)
    .filter(v => !!v)

  if (!parameters.length) {
    return null
  }

  return { key: 'parameter', value: OrderedMap(parameters.reduce(convertEntryListInMap, {})) }
}

/**
 * extracts a shared endpoint as a key-value entry
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of an
 * endpoint.
 * @returns {{key: string, value: URL}} the corresponding endpoint, as a key-value pair
 *
 * Note that the key should be a uniquely identifying value.
 */
methods.extractSharedEndpointFromItemEndpoint = () => null

/**
 * extracts all shared endpoints as a key-value pair for a TypedStore (aka OrderedMap)
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of
 * shared endpoints.
 * @returns {{key: 'endpoint', value: OrderedMap<string, URL>}} the corresponding TypedStore, as a
 * key-value pair.
 */
methods.extractEndpointTypedStore = (itemOrSubItem) => {
  const endpoints = itemOrSubItem.endpoints
    .map(methods.extractSharedEndpointFromItemEndpoint)
    .filter(v => !!v)

  if (!endpoints.length) {
    return null
  }

  return { key: 'endpoint', value: OrderedMap(endpoints.reduce(convertEntryListInMap, {})) }
}

/**
 * extracts a shared constraint as a key-value entry
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * constraint.
 * @returns {{key: string, value: Constraint}} the corresponding constraint, as a key-value pair
 *
 * Note that the key should be a uniquely identifying value.
 */
methods.extractSharedConstraintFromItemConstraint = () => null

/**
 * extracts all shared constraints as a key-value pair for a TypedStore (aka OrderedMap)
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of
 * shared constraints.
 * @returns {{key: 'constraint', value: OrderedMap<string, Constraint>}} the corresponding
 * TypedStore, as a key-value pair.
 */
methods.extractConstraintTypedStore = (itemOrSubItem) => {
  const constraints = OrderedMap(itemOrSubItem.constraints || {})
    .map(methods.extractSharedConstraintFromItemConstraint)

  return { key: 'constraint', value: constraints }
}

/**
 * extracts a shared parameter as a key-value entry
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * parameter.
 * @returns {{key: string, value: Parameter}} the corresponding parameter, as a key-value pair
 *
 * Note that the key should be a uniquely identifying value.
 */
methods.extractStoreInstance = (itemOrSubItem) => {
  const kvs = [
    methods.extractParameterTypedStore(itemOrSubItem),
    methods.extractEndpointTypedStore(itemOrSubItem),
    methods.extractAuthTypedStore(itemOrSubItem),
    methods.extractConstraintTypedStore(itemOrSubItem)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

/**
 * extracts an Api `store` field as a key-value entry
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `store` field.
 * @returns {{key: 'store', value: Store}} the corresponding store field, as a key-value pair
 *
 * Note that the store field should be a Store Record
 */
methods.extractStore = (itemOrSubItem) => {
  const storeInstance = methods.extractStoreInstance(itemOrSubItem)
  return { key: 'store', value: new Store(storeInstance) }
}
// ** END STORE **

// ** BEGIN REQUEST **
/**
 * extracts a Request `name` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `name` field.
 * @returns {{key: 'name', value: string}?} the corresponding group field, as a key-value
 * pair
 */
methods.extractRequestNameFromItem = () => null

/**
 * extracts a Request `description` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `description` field.
 * @returns {{key: 'description', value: string}?} the corresponding description field, as a
 * key-value pair
 */
methods.extractRequestDescriptionFromItem = () => null

/**
 * extracts a Request ParameterContainer `queries` block as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `queries` field.
 * @returns {{key: 'queries', value: OrderedMap<string, Parameter|Reference>}?} the corresponding
 * queries field, as a key-value pair
 *
 * Note that the queries block should be an OrderedMap of ids to either Parameter or Reference to
 * shared Parameters.
 */
methods.extractQueryBlockFromQueryParams = () => null

/**
 * extracts a Request ParameterContainer `headers` block as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `headers` field.
 * @returns {{key: 'headers', value: OrderedMap<string, Parameter|Reference>}?} the corresponding
 * headers field, as a key-value pair
 *
 * Note that the headers block should be an OrderedMap of ids to either Parameter or Reference to
 * shared Parameters.
 */
methods.extractHeaderBlockFromHeaders = () => null

/**
 * extracts a Request ParameterContainer `body` block as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `body` field.
 * @returns {{key: 'body', value: OrderedMap<string, Parameter|Reference>}?} the corresponding
 * body field, as a key-value pair
 *
 * Note that the body block should be an OrderedMap of ids to either Parameter or Reference to
 * shared Parameters.
 */
methods.extractBodyBlockFromBody = () => null

/**
 * extracts a Request ParameterContainer instance
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * ParameterContainer field.
 * @returns {ParameterContainerInstance} an object holding all the information necessary to the
 * instantiation of a ParameterContainer Record.
 */
methods.extractRequestParameterContainerInstanceFromItem = (itemOrSubItem) => {
  const kvs = [
    methods.extractQueryBlockFromQueryParams(itemOrSubItem.query),
    methods.extractHeaderBlockFromHeaders(itemOrSubItem.header),
    methods.extractBodyBlockFromBody(itemOrSubItem.body)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

/**
 * extracts a Request `parameters` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `parameters` field.
 * @returns {{key: 'parameters', value: ParameterContainer}} the corresponding parameters field, as
 * a key-value pair
 *
 * Note that the parameters block should be a ParameterContainer Record.
 */
methods.extractRequestParametersFromItem = (itemOrSubItem) => {
  const key = 'parameters'
  const parameterContainerInstance = methods.extractRequestParameterContainerInstanceFromItem(
    itemOrSubItem
  )

  return { key, value: new ParameterContainer(parameterContainerInstance) }
}

/**
 * extracts a Request Auth Reference, if it is extractable
 * @param {ItemPart} auth - a part of the file that is relevant to the extraction of a
 * Reference.
 * @returns {Reference?} the corresponding auth References
 *
 * Note that the References uuid should be the uniquely identifying values used to saved shared
 * Auths in the Store.
 */
methods.extractAuthRefFromAuth = (auth) => {
  return new Reference({
    type: 'auth',
    uuid: auth.unique_identifying_key
  })
}

/**
 * extracts a Request `auths` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of an
 * `auths` field.
 * @returns {{key: 'auths', value: List<Reference?>}} the corresponding auths field, as
 * a key-value pair
 *
 * Note that the auths field should be a List of References or null values. If a null value is
 * included in the List of References, it means that this Request can be executed without
 * the need of an Authentication.
 */
methods.extractAuthsFromItem = (itemOrSubItem) => {
  const auths = itemOrSubItem.auths
    .map(methods.extractAuthRefFromAuth)
  return { key: 'auths', value: List(auths) }
}

/**
 * extracts a Request `method` field as a key-value entry
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of an
 * `method` field.
 * @returns {{key: 'method', value: string}} the corresponding method field, as
 * a key-value pair
 */
methods.extractRequestMethodFromItem = () => null

/**
 * extracts a Request `endpoints` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of an
 * `endpoints` field.
 * @returns {{key: 'endpoints', value: OrderedMap<string, URL|Reference>}} the corresponding
 * endpoints field, as a key-value pair
 *
 * Note that the endpoints field should be an OrderedMap of string ids to URL Records or Reference
 * Records. We **strongly** advocate to only have shared endpoints and to only have References in
 * the OrderedMap.
 */
methods.RequestEndpointsFromItem = () => null

/**
 * extracts a Request instance
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * Request Record.
 * @returns {RequestInstance} an object holding all the information necessary to the
 * instantiation of a Request Record.
 */
methods.extractRequestInstanceFromItem = (itemOrSubItem) => {
  const kvs = [
    methods.RequestEndpointsFromItem(itemOrSubItem),
    methods.extractRequestNameFromItem(itemOrSubItem),
    methods.extractRequestDescriptionFromItem(itemOrSubItem),
    methods.extractRequestParametersFromItem(itemOrSubItem),
    methods.extractRequestMethodFromItem(itemOrSubItem),
    methods.extractAuthsFromItem(itemOrSubItem)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

/**
 * extracts a Resource `methods` Request component as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * Request Record.
 * @returns {{key: string, value: Request}} the corresponding Request field, as a key-value pair
 *
 * Note that the Request field should be a Request Record. We recommend the key to be the method
 * of the Request (as API formats do not support polymorphism of request for a same method)
 */
methods.extractRequestFromItem = (itemOrSubItem) => {
  const key = itemOrSubItem.method
  const requestInstance = methods.extractRequestInstanceFromItem(itemOrSubItem)

  return { key, value: new Request(requestInstance) }
}
// ** END REQUEST **

// ** BEGIN RESOURCE **
/**
 * extracts a Resource `endpoints` field as a key-value entry
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `endpoints` field.
 * @returns {{key: 'endpoints', value: OrderedMap<string, URL|Reference>}} the corresponding
 * endpoint field, as a key-value pair
 *
 * Note that the endpoints field should be an OrderedMap of string ids to URL Records or Reference
 * Records. We **strongly** recommend to only use Reference to shared endpoints, as this make a lot
 * of processing easier
 */
methods.extractResourceEndpointsFromItem = () => null

/**
 * extracts a Resource `path` field as a key-value entry. The path field is represented by a URL
 * Record whose `pathname` field contains the path of the resource (e.g. the representation of
 * /users/{userId}/songs/:songId will be stored there)
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `path` field.
 * @returns {{key: 'path', value: URL}} the corresponding path field, as a
 * key-value pair
 *
 * Note that the path field should be a URL Record.
 */
methods.extractResourcePathFromItem = () => null

/**
 * extracts a Resource `description` field as a key-value entry, if it is extractable
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `description` field.
 * @returns {{key: 'description', value: string}?} the corresponding description field, as a
 * key-value pair
 */
methods.extractResourceDescriptionFromItem = () => null

/**
 * extracts a Resource `methods` field as a key-value entry, if it is extractable. This is where
 * Request Records are stored.
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `methods` field.
 * @returns {{key: 'methods', value: OrderedMap<string, Request>}?} the corresponding methods field,
 * as a key-value pair
 *
 * Note that the methods fields should be an OrderedMap of string ids to Request Records.
 */
methods.extractResourceRequestsFromItem = (itemOrSubItem) => {
  const requests = itemOrSubItem.requests
    .map(methods.extractRequestFromItem)
    .filter(v => !!v)

  if (!requests.length) {
    return null
  }

  return { key: 'methods', value: OrderedMap(requests.reduce(convertEntryListInMap, {})) }
}

/**
 * extracts a Resource instance
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * Resource Record.
 * @returns {ResourceInstance} an object holding all the information necessary to the
 * instantiation of a Resource Record.
 */
methods.extractResourceInstanceFromItemResource = (itemOrSubItem) => {
  const kvs = [
    methods.extractResourceEndpointsFromItem(itemOrSubItem),
    methods.extractResourcePathFromItem(itemOrSubItem),
    methods.extractResourceDescriptionFromItem(itemOrSubItem),
    methods.extractResourceRequestsFromItem(itemOrSubItem)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

/**
 * extracts a Api `resources` component as a key-value entry, if it is extractable. This is where
 * Resource Records are stored.
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * Resource Record.
 * @returns {{key: string, value: Resource}} the corresponding Resource Record, as a key-value pair
 *
 * Note that the methods fields should be an OrderedMap of string ids to Request Records.
 */
methods.extractResourceFromItemResource = (itemOrSubItem) => {
  const key = itemOrSubItem.unique_identifying_key
  const resourceInstance = methods.extractResourceInstanceFromItemResource(itemOrSubItem)
  return { key, value: new Resource(resourceInstance) }
}

/**
 * extracts an Api `methods` field as a key-value entry, if it is extractable. This is where
 * Resources Records are stored in an Api.
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of a
 * `resources` field.
 * @returns {{key: 'resources', value: OrderedMap<string, Resource>}?} the corresponding resources
 * field, as a key-value pair
 *
 * Note that the methods fields should be an OrderedMap of string ids to Request Records.
 */
methods.extractResources = (itemOrSubItem) => {
  const resources = itemOrSubItem.resources
    .map(methods.extractResourceFromItemResource)
    .filter(v => !!v)

  return { key: 'resources', value: OrderedMap(resources.reduce(convertEntryListInMap, {})) }
}
// ** END RESOURCE **

/**
 * extracts an Api instance. This is the core element of the model.
 * @param {ItemPart} itemOrSubItem - a part of the file that is relevant to the extraction of an
 * Api Record.
 * @returns {ApiInstance} an object holding all the information necessary to the
 * instantiation of an Api Record.
 */
methods.extractApiInstance = (itemOrSubItem) => {
  const kvs = [
    methods.extractInfo(itemOrSubItem),
    methods.extractGroup(itemOrSubItem),
    methods.extractStore(itemOrSubItem),
    methods.extractResources(itemOrSubItem)
  ].filter(v => !!v)

  return kvs.reduce(convertEntryListInMap, {})
}

methods.parse = ({ options, item }) => {
  const apiInstance = methods.extractApi(item)

  return { options, api: new Api(apiInstance) }
}

export const __internals__ = methods
export default TemplateParser
