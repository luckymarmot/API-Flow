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

## Why use an internal model
Because it's `n/2` times faster to implement than 1-to-1 conversions, where `n` is the number of
format-versions that we want to support.

## Decomposing the Internal Model
The internal model tries to describe what an API can do with as reduced set of components that, in
theory, should be able to describe an API as well as any API Format.

### Core Components of the API-Flow model
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

#### Group
The Group Record can be seen as a folder. It can have a name, and hold other folders. It can also
hold ID references to resources stored in the `resources` field. Note that these are not Reference
Record but simple id strings.

#### Resource
The Resource Record is a container for one or multiple operations (a.k.a. Request) that share a path
and endpoint(s). It is composed of the following fields:
- **name -** the name of the Resource (optional)
- **uuid -** a unique identifier for the Resource (optional)
- **endpoints -** a Map of URLs or References to shared endpoints that is used by this
  resource. We **strongly** recommend to only have References to shared endpoints in this Map.
- **path -** a URL representing the path of the Resource.
- **methods -** a Map holding all the Request Records that are associated with this Resource
- **description -** a description of the Resource (optional)
- **interfaces -** a Map of Interfaces or References to shared Interfaces that this Resource
  implements.

#### Request
// TODO
