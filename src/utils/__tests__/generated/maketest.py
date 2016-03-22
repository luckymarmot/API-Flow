import yaml
import json
import sys

if __name__ == '__main__':
  # input
  print('input:')
  inputstr = ''
  while True:
    new_inputstr = raw_input('> ')
    if not new_inputstr:
      break
    if inputstr:
      inputstr += '\n'
    inputstr += new_inputstr

  # output
  print('output: ')
  outputlist = []
  while True:
    outputstr = raw_input('< ')
    if not outputstr:
      break
    outputlist.append(outputstr)

  with open('tests.yaml', 'r') as f:
    d = yaml.load(f)

  if inputstr:
    d.get('tests').append({
      'input':inputstr,
      'output':(outputlist[0] if len(outputlist) == 1 else outputlist),
    })
  else:
    sys.stderr.write('No input, just cleaning up files...')

  with open('tests.yaml', 'w') as f:
    yaml.dump(d, f, default_flow_style=False)

  with open('tests.json', 'w') as f:
    json.dump(d, f, indent=2)
