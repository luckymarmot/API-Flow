## CurlParser Interface

* parse(string)

## Available cURL Options

This importer does not support the full cURL syntax. Supported arguments are:

### General

* `--url` or last string, will set the url (including protocol, http etc) (see [curl --url](http://curl.haxx.se/docs/manpage.html#--url))
* `-X, --request` define method, default to automatic (GET, or POST if body data is present) (see [curl -X](http://curl.haxx.se/docs/manpage.html#-X))
* `-I, --head` sets the method to `HEAD` (see [curl -I](http://curl.haxx.se/docs/manpage.html#-I))
* `-m, --max-time` sets the request timeout in seconds (see [curl -m](http://curl.haxx.se/docs/manpage.html#-m))

### Headers

* `-H, --header` define header (use `:` to separate name and value) (see [curl -H](http://curl.haxx.se/docs/manpage.html#-H))
* `-e, --referer` will set a `Referer` header (see [curl -e](http://curl.haxx.se/docs/manpage.html#-e))
* `-A, --user-agent` will set a `User-Agent` header (see [curl -A](http://curl.haxx.se/docs/manpage.html#-A))
* `-b, --cookie` will set a `Cookie` header (see [curl -b](http://curl.haxx.se/docs/manpage.html#-b))
* `--compressed` will *append* `gzip` to encoding headers (see [curl --compressed](http://curl.haxx.se/docs/manpage.html#--compressed))

### Auth

* `-u, --user` define username and password for HTTP Basic Auth (can also define in the URL with the format `http://username:password@domain.com`) (see [curl -u](http://curl.haxx.se/docs/manpage.html#-u))

### Body

* `-d, --data` set body data (see [curl -H](http://curl.haxx.se/docs/manpage.html#-H))
* `--data-ascii` same as `-d, --data` (see [curl --data-ascii](http://curl.haxx.se/docs/manpage.html#--data-ascii))
* `--data-binary` same as `-d, --data`, but newlines won't be stripped in files *(behavior not yet supported here)* (see [curl --data-binary](http://curl.haxx.se/docs/manpage.html#--data-binary))
* `--data-raw` same as `-d, --data`, but no file references will be parsed (see [curl --data-raw](http://curl.haxx.se/docs/manpage.html#--data-raw))
* `--data-urlencode` set body data, data will be url-encoded (see [curl --data-urlencode](http://curl.haxx.se/docs/manpage.html#--data-urlencode))
* `-F, -form` set body as `multipart/form-data` (see [curl -F](http://curl.haxx.se/docs/manpage.html#-F))
* `--form-string` same as `-F, -form`, but no file references will be parsed (see [curl --form-string](http://curl.haxx.se/docs/manpage.html#--form-string))

### Separators

* `-:` and `--next` will separate next URLs from the options before this option (see [curl -:](http://curl.haxx.se/docs/manpage.html#-))
* all common shell separators will be interpreted as a new curl request (`&`, `&&`, `|`, etc.)
* shell redirections (`>`, `2>`, etc.) will be ignored, but arguments after are still parsed (e.g. `curl httpbin.org/post > output.txt -d key=value` works) 

### Short Options

Short options may be joined with their value in the same argument (e.g. both `-X POST` with a space and `-XPOST` without space are valid).

### Quotes

* `'` single quotes *"Enclosing characters in single quotes preserves the literal value of each character within the quotes. A single quote may not occur between single quotes, even when preceded by a backslash."* (man bash)
* `"` double quotes *"Enclosing characters in double quotes preserves the literal value of all characters within the quotes...The backslash retains its special meaning only when followed by one of the following characters: $, `, ", \, or <newline>. A double quote may be quoted within double quotes by preceding it with a backslash."* (man bash)
* `$''` "dollar sign" quotes *"Words of the form $'string' are treated specially. The word expands to string, with backslash-escaped characters replaced as specified by the ANSI C standard. Backslash escape sequences, if present, are decoded..."* (man bash), this extension supports the same escapes as bash:
  * standard escapes: `\n`, `\r`, `\t`, `\a`, `\b`, `\f`, `\v`, `\e`, `\E`, `\\`, `\'`, `\"`
  * octal escapes: `\nnn` *"the eight-bit character whose value is the octal value nnn (one to three digits)"*
  * hexadecimal escapes: `\xHH` *"the eight-bit character whose value is the hexadecimal value HH (one or two hex digits)"*
  * `\cx` control characters

### Files

Do to OS X sandboxing, Paw cannot read from local files. All file references used in
curl commands will be replaced by an empty FileDynamicValue.

## Examples

### Basic Auth

```shell
curl https://myuser:mypassword@httpbin.org/get
curl https://httpbin.org/get -u myuser:mypassword
```

### `application/json`

```shell
curl http://httpbin.org/post -d '{"key":"va=l&u=e"}' -H Content-Type:application/json
```