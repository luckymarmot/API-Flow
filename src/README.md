# Understanding API-Flow
This document tries to briefly explain how API-Flow functions and how you can extend it.

## The API-Flow conversion flow
API-Flow converts an API format into another in 4 different steps
1. **Setup -** API-Flow sets the environment in which the conversion will be done (node, web, paw,
  etc.). At this point, the user can set up a cache to help with the resolution of missing URIs.
2. **Loading -** API-Flow tries to resolve a URI to a file and then parses this file to look for
  missing references, and to fix/normalize parts of the file that can be improved
3. **Parsing -** API-Flow parses the normalized file and converts it into its internal model
4. **Serializing -** API-Flow converts the internal model representation into a target format.

If you want to see what a converter would look like, you can refer yourself to the file
`src/api-flow.js`

## Why use an internal model
Because it's `n/2` times faster to implement than 1-to-1 conversions, where `n` is the number of
format-versions that we want to support.

## Decomposing the Internal Model
The internal model tries to describe what an API can do with as reduced set of components that, in
theory, should be able to describe an API as well as any API Format.

### Core Components of the API-Flow model
In this section we expose a small group of core components as well as some of their subtleties.
This section does not exhaustively cover all components of the API-Flow, and leaves the more trivial
ones to the comprehension of the reader.

#### Api
The Api Record is the root component that holds all the other components. It is composed of 4 fields
that describe different aspects of an API.
- **info -** the info field is represented by an Info Record that holds metadata relative to the
  Api, such as the License, the terms of service, the Api version or more importantly, the title of
  the Api.
- **store -** the store field is represented by a Store Record that holds all shared elements in the
  Api, such as endpoints, authentication methods, parameters, responses, constraints, etc.
- **group -** the group field is represented by a Group Record that holds the structure of the Api
  in its source file. This can then be used if the target format does not have strict structural
  requirements (e.g. Paw)
- **resources -** the resources field is represented by a dictionary of Resource Records that holds
  all the resources of an Api. We define a Resource in very much the same way as Swagger or RAML;
  that is, that a Resource is the ensemble of operations accessible from a given path. We do not
  impose a unicity restriction on Resources based on their path, which means that two different
  Resources can share the same path. We however recommend to have a disjunction of the Requests
  based on their methods for a given Resource path. If this recommendation is not respected, the
  conversion may result in an unnecessary loss of information.

#### Store
The Store Record is relatively plain and simple. It defines a Map (aka TypedStore) for different
components of the Api, which are the following:
- **constraint -** this TypedStore holds all the shared constraints of the Api. (A JSON Schema is
  a constraint)
- **endpoint -** the TypedStore holds all the shared endpoints of the Api. We recommend that all
  endpoints be stored here, even if they are only used once
- **parameter -** this TypedStore holds all the shared parameters of the Api. These shared
  parameters must include their location of use (query, header, body, path) as well as whether they
  are to be used in a request or a response.
- **response -** this TypedStore holds all the shared responses of the Api.
- **auth -** this TypedStore holds all the shared authentication methods of the Api. We **require**
  that all authentication methods used in the Api be store in this TypedStore.
- **variable -** this TypedStore holds all the the shared variables of the Api. Variables are
  contextual constraints that cannot be represented by a JSON Schema. Variables change behavior
  together based on a environment name. This is used in Paw and Postman to represent environment
  variables, where you can switch between different environments.
- **interface -** this TypedStore holds all the shared interfaces that are used throughout the Api.
  These interfaces can be used to describe features that are shared across multiple resources,
  requests, responses, parameters, etc.

Note that these fields are all written in their singular form instead of plural. The rationale
behind it being that these field names are types of store.

The Store is referenced from other components of the Api by use of References.

#### Reference
The Reference record is a simple component with two fields that uniquely identify an object in the
store. The two fields are `type` and `uuid`. In addition to these two fields, there is a third
`overlay`.
- **type -** this field corresponds to the name of a TypedStore (e.g. `constraint`, `auth`, etc.)
- **uuid -** this field corresponds to the id of an object inside a TypedStore. As such, there are
  no requirements that the id be unique across all objects, but only inside the TypedStore. It is,
  however, preferred to have it behave as a uuid.
- **overlay -** this field is used to override part of the object that the Reference links to. If it
  is defined, it **must** always be of the same type as the underlying object. This is particularly
  useful to add applicableContexts to shared Parameters (more about what an applicableContexts is
  can be found in the Parameter section)

**Accessing an object in the Store**
Given a Reference, one can easily access the corresponding object in the Store with the following
snippet:

```js
const ref = new Reference({ type: 'auth', uuid: 'basic_auth' })
let auth
auth = store.getIn([ ref.get('type'), ref.get('uuid') ])
// or
auth = store.getIn(ref.getLocation())
```

#### Group
The Group Record can be seen as a folder. It can have a name, and hold other folders. It can also
hold ID references to resources stored in the `resources` field. Note that these are not Reference
Record but simple id strings.

#### Resource
The Resource Record is a container for one or multiple operations (a.k.a. Request) that share a path
and endpoint(s). It is composed of the following fields:
- **uuid -** a unique identifier for the Resource (optional)
- **name -** the name of the Resource (optional)
- **description -** a description of the Resource (optional)
- **endpoints -** a Map of URLs or References to shared endpoints that is used by this
  resource. We **strongly** recommend to only have References to shared endpoints in this Map.
- **path -** a URL representing the path of the Resource.
- **methods -** a Map holding all the Request Records that are associated with this Resource
- **interfaces -** a Map of Interfaces or References to shared Interfaces that this Resource
  implements.

#### Request
The Request Record contains all the elements necessary to describing an operation on a resource.
- **id -** a unique identifier for this operation (optional)
- **name -** the name of the Request/Operation (optional)
- **description -** a description of the Request/Operation (optional)
- **method -** the method to be used with this operation. API-Flow does not impose
  restrictions on what verbs can be used with operations (however, some formats do).
- **auths -** a List of all the authentication methods this operation can be used. This **must** be
  a List of References to shared authentication methods, with a potential `null` value included. If
  a `null` value is included, this means that this operation can also be used without any
  authentication.
- **contexts -** a List of the possible Contexts that this operation can be used with. Contexts are
  a relatively complex component of API-Flow and warrant a separate explanation. You can read more
  about Contexts and what they represent in their dedicated section.
- **parameters -** a container that holds all the possible parameters that can be used with this
  operation, aka a ParameterContainer. The parameters can be defined directly in the container, or
  be References to shared parameters saved in the Store. They can also be filtered out depending on
  a Context, to give different views of operation. You can learn more about the ParameterContainer
  and Parameters in their dedicated sections.
- **responses -** a Map of Responses or References to shared responses that can be returned by this
  operation.
- **endpoints -** a Map of URLs or References to shared endpoints that is used by this
  request. We **strongly** recommend to only have References to shared endpoints in this Map, if it
  is used. If this Map is left empty, the `endpoints` field from the containing `Resource` should be
  used.
- **interfaces -** a Map of Interfaces or References to shared Interfaces that this Request
  implements.

#### Context
Contexts are one of the more powerful and complex aspects of API-Flow, and are a generalization of
the concept of typed bodies in RAML. In RAML, it is possible to define different bodies
schemas/dataTypes depending on the Content-Type, which can be particularly useful to represent the
differences between JSON and XML schemas. In this case, each Content-Type header value would define
a Context, and the body parameters would be filtered according to which context is applicable to
them.

For instance, if we had the Context<Content-Type=application/json> and two body
Parameters, with one being applicable in application/json, while the other be applicable in
application/xml. Then, we could filter the body parameters based on the context to only get the
parameters that are relevant to this context. This would be how to represent a RAML body with
multiple schemas/dataTypes: a List of Contexts, each describing the possible value of the
Content-Type header, and a Map of Body Parameters, each with a single applicableContext.

However, Contexts are more powerful than their RAML counterpart, as they can, in theory, be applied
not only to body Parameters, but also to headers, query parameters, and path parameters. They are
also not limited to only describing Content-Type header values, but can be used with any
parameter-value pair, and are not limited to having a single Parameter as their set of constraints.
This means that the API-Flow model is able to describe conditional use of parameters based on the
values of different parameters, like, for instance, the use of the `Accept-Encoding` header only if
the `Accept` header has a value, or a variation of accepted values for `Accept-Encoding` based on
the values of `Accept-Language`. In practice, we have seen no format that allows such level of
describability, with RAML v1.0 and swagger v3.0 being the most descriptive.

**Note:** If you are trying to implement a Serializer for a format that does not support having
multiple contexts, we **strongly** recommend that you take one of the contexts and represent it,
instead of ignoring Contexts altogether, as ignoring contexts may lead to incoherent definitions of
certain parameters, or duplicate parameters that shouldn't.

A Context is composed of the following field:
- **constraints -** a List of Parameter that have a given default value. This is what is used to
filter parameters down to a certain view.

#### ParameterContainer
A ParameterContainer is a simple container that holds three main blocks, one for each part of a
Request/Response in which parameters can be found: the headers, the query, and the body. This
container also exposes two methods that can be used to make manipulation of Parameters more
pleasant: resolve and filter.

A ParameterContainer is therefore composed of the following fields:
- **headers -** a Map of Parameters or References to shared Parameters that describe headers
- **queries -** a Map of Parameters or References to shared Parameters that describe query
  parameters. The use of the term `queries` instead of the simpler `query` cannot be explained.
- **body -** a Map of Parameters or References to shared Parameters that describe body parameters.

In Addition to these fields, a ParameterContainer exposes the following two methods.
- **resolve(store) -** this method iterates over the different parameters in the container and
  replaces references to shared parameters by the shared parameters. This transforms a
  `Map<string,Parameter|Reference>` into a `Map<string, Parameter>`.
- **filter(constraints) -** this method iterates over the different parameters in the container and
  filters out Parameters which should not be used with this List of constraints. This List of
  constraints is naturally the `constraints` field of a Context. Note that `filter` can only be
  applied to ParameterContainers that do not contain References. Not resolving before filtering will
  crash.

#### Parameter
A Parameter is a representation of a simple block of an operation. It can represent a query
parameter, or a header or a body, or path variable. It is used to describe the variability of an
operation.

A Parameter is composed of the following fields:
- **in -** the location of the Parameter. this can be `header`, `query`, `body` or `path`.
- **usedIn -** this describes whether this Parameter is used in a Request or a Response. Both `in`
  and `usedIn` can be inferred from their location in a ParameterContainer and the containing
  Request or Response Record, except when dealing with shared Parameters that are therefore stored
  out of their context and may need these fields to properly function
- **key -** the key of the Parameter. For instance, the Parameter representing the
  `Content-Type: application/json` header has the key `Content-Type`, while the Parameter
  representing the `limit=100` query parameter has the key `limit`.
- **name -** the name of the Parameter. While this is very often the same as the key of the
  Parameter, there can be cases where having a different, more human-friendly name, for a parameter
  is useful. This would be where such a display name would be stored.
- **description -** a description of the Parameter.
- **type -** the type of the Parameter (e.g. string, integer, number, boolean, etc.). The type
  `array` defines a special behavior for the Parameter, which is explained in details further below.
- **format -** the format of the Parameter (e.g. 'datetime', etc.). This is field has not yet been
  normalized, and is therefore unstable. Use with caution.
- **default -** the default value of the Parameter.
- **superType -** the superType of the Parameter. Setting this value to something else than `null`
  signifies that this Parameter has a non-standard behavior. For instance, if the superType is set
  to `sequence`, this signifies that the Parameter describes a sequence of Parameters whose
  evaluation should be concatenated, which is particularly useful to describe paths that contain
  variables. A more detailed explanation can be found below.
- **value -** a complex object whose definition varies based on the superType and type. It contains
  the components necessary to the representation of such superTypes and types. Note this should
  **not** be confused with default. `default` represents the default value of a Parameter, whereas
  `value` can contain a Parameter describing the schema of an item in an array if the type is
  `array`. therefore it is possible to have both a `default` and `value` at the same time.
- **constraints -** this is a List of all the constraints this Parameter is subject to. This is
  represented by a List of Constraint. You can find more about Constraints in their dedicated
  section further below.
- **applicableContexts -** this is a List describing all the contexts in which a Parameter can be
  used. If the List is left empty, this means that this Parameter can be used regardless of Context.
  Note that this is not a List of Contexts, but a List *describing* contexts. As such, there are
  minute differences that need to be considered. For instance, valid context values are not defined
  as `default` valued Parameters, but as Parameters with constraints such as
  `Constraint.Enum([ default1, default2, ... ])`. This means that for instance a Parameter that can
  be used in both `application/x-www-form-urlencoded` and `multipart/form-data`, is described by a
  single applicable context Parameter whose constraints is an Enum of both values.
- **interfaces -** this is a Map of Interfaces or References to shared Interfaces that this
  Parameter implements.

#### Constraint
A Constraint Record is a simple representation of a constraint, and can test a value to see whether
it complies with the constraint.

There are many different Constraint that all follow a standard pattern:
- **name -** this field describes the name to give to the constraint when representing it as a JSON
  Schema. It is not accessible from the different standard Constraints constructors.
- **value -** if `name` held the left-hand side of the JSONSchema, then `value` would hold the
  right-hand side of it. It is often the only field accessible from the constructors.
- **expression -** this field is a function that is used to test whether a value is valid with
  respect to the constraint. It also rarely accessible.

Constraints expose two methods:
- **evaluate(value) -** tests whether a value is valid with respect to the constraint
- **toJSONSchema() =** returns the JSON Schema representation of this constraint

Here are some notable Constraint constructors:
- `new Constraint.Enum([ ... ])`
- `new Constraint.JSONSchema({ type: 'string', pattern: ... })`
- `new Constraint.XMLSchema('<some:xsd/>')` exists, but is more of a patch than a real
  representation of an XSD schema.
- `new Constraint.Constraint({ name, value, expression })` can be used to create custom constraints
  that cannot be represented by the commonly available Constraints.

#### Response
A Response Record holds all the information relative to the expected responses to an operation
under a certain status code.
- **code -** the status code that this Response describes
- **description -** a description of this Response (optional)
- **parameters -** a ParameterContainer that holds all the Parameters or References relative to this
  response.
- **contexts -** a List of possible Contexts that this response can be used in.
- **interfaces -** this is a Map of Interfaces or References to shared Interfaces that this
  Response implements.

#### Auth
API-Flow supports multiple types of authentication methods, which are represented by the Auth
object. These authentication methods are fairly straightforward and their definitions can be found
in the `src/models/auths` folder.

Here is a list of the currently support authentication method:
- `Auth.ApiKey`
- `Auth.AWSSig4`
- `Auth.Basic`
- `Auth.Digest`
- `Auth.Hawk`
- `Auth.OAuth1`
- `Auth.OAuth2`
- `Auth.Custom`
