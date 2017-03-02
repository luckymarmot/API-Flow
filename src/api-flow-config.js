import SwaggerLoader from './loaders/swagger/Loader'
import RAMLLoader from './loaders/raml/Loader'
// import JSONLoader from './loaders/json/Loader'
// import AnyTypeLoader from './loaders/any/Loader'

export const loaders = [
  new SwaggerLoader(),
  new RAMLLoader()
  /* ,
  JSONLoader,
  AnyTypeLoader
  */
]
