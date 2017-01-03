BASE=$(shell pwd)
SCRIPTS=$(BASE)/scripts
extensions_dir=$(HOME)/Library/Containers/com.luckymarmot.Paw/Data/Library/Application\ Support/com.luckymarmot.Paw/Extensions/

all: configure pack

configure:
	sh "$(SCRIPTS)/configure.sh" $(BASE)

runners:
	sh "$(SCRIPTS)/runners.sh" $(BASE) $(TARGET)

importers:
	sh "$(SCRIPTS)/importers.sh" $(BASE) $(TARGET)

generators:
	sh "$(SCRIPTS)/generators.sh" $(BASE) $(TARGET)

transfer: importers generators
	sh "$(SCRIPTS)/transfer.sh" $(BASE) $(extensions_dir) $(TARGET)

pack: importers generators
	sh "$(SCRIPTS)/pack.sh" $(BASE) $(TARGET)

flow-server:
	./node_modules/.bin/babel-node --expose-gc "$(SCRIPTS)/flow-runner.js"

lint:
	sh "$(SCRIPTS)/lint.sh" $(BASE)

test:
	sh "$(SCRIPTS)/test.sh" $(BASE)

validate: lint test

watch:
	sh "$(SCRIPTS)/watch.sh" $(BASE) $(COMMAND)
