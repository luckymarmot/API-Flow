#! /Library/Frameworks/Python.framework/Versions/2.7/bin/python

import sys
import json

class CheckException (Exception):
  pass

def check(input):
  from subprocess import Popen, PIPE
  bash_command = './test.py {0}'.format(input)
  c = Popen(['/bin/bash', '-c', bash_command], stdout=PIPE, stderr=PIPE)
  # c = Popen(bash_command, shell=True, stdout=PIPE, stderr=PIPE)
  (stdout, stderr) = c.communicate()
  try:
    args = json.loads(stdout).get('args')
  except ValueError:
    raise CheckException('JSON error decoding: {}\nstderr: {}\n'.format(stdout, stderr))
  if not args:
    raise CheckException('Invalid JSON output: {}\nstderr: {}\n'.format(stdout, stderr))
  return args

def checkfile(testfile):
  import yaml

  with open(testfile, 'r') as f:
    tests = yaml.load(f).get('tests')

  for test in tests:
    inputstr = test['input']
    output = test['output']
    if isinstance(output, basestring):
      output = [output]
    output_checked = check(inputstr)
    if not output_checked:
      raise CheckException('Error returning output for\ninput: {}\nactual output: {}\n'.format(
        inputstr, output_checked,
      ))
    output_checked = output_checked[1:]
    if output != output_checked:
      raise CheckException('Mismatch output for input: {}\nexpected: {}\nactual: {}\n'.format(
        inputstr, output, output_checked,
      ))

    sys.stderr.write('> {}\n'.format(inputstr))
    for outputline in output:
      sys.stderr.write('< {}\n'.format(outputline))

if __name__ == '__main__':
  try:
    checkfile('tests.yaml')
  except CheckException as e:
    sys.stderr.write(str(e))
    exit(1)
