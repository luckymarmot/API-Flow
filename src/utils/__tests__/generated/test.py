#! /Library/Frameworks/Python.framework/Versions/2.7/bin/python

import sys
import json

sys.stdout.write(json.dumps({
  'args':sys.argv
}).encode('utf-8'))
