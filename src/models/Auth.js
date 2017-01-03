import BasicAuth from './auths/Basic'
import DigestAuth from './auths/Digest'
import NTLMAuth from './auths/NTLM'
import NegotiateAuth from './auths/Negotiate'
import ApiKeyAuth from './auths/ApiKey'
import OAuth1Auth from './auths/OAuth1'
import OAuth2Auth from './auths/OAuth2'
import AWSSig4Auth from './auths/AWSSig4'
import HawkAuth from './auths/Hawk'

const Auth = {
  Basic: BasicAuth,
  Digest: DigestAuth,
  NTLM: NTLMAuth,
  Negotiate: NegotiateAuth,
  ApiKey: ApiKeyAuth,
  OAuth1: OAuth1Auth,
  OAuth2: OAuth2Auth,
  AWSSig4: AWSSig4Auth,
  Hawk: HawkAuth
}

export default Auth
