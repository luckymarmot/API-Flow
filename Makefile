BASE=$(shell pwd)
SCRIPTS=$(BASE)/scripts
extensions_dir=$(HOME)/Library/Containers/com.luckymarmot.Paw/Data/Library/Application\ Support/com.luckymarmot.Paw/Extensions/

all: configure pack

clean:
	sh "$(SCRIPTS)/clean.sh" $(BASE)

configure:
	sh "$(SCRIPTS)/configure.sh" $(BASE)

runners:
	sh "$(SCRIPTS)/runners.sh" $(BASE) $(TARGET)

importers:
	sh "$(SCRIPTS)/importers.sh" $(BASE) $(TARGET)

generators:
	sh "$(SCRIPTS)/generators.sh" $(BASE) $(TARGET)

transfer: clean importers generators
	sh "$(SCRIPTS)/transfer.sh" $(BASE) $(extensions_dir) $(TARGET)

pack: clean importers generators
	sh "$(SCRIPTS)/pack.sh" $(BASE) $(TARGET)

watch:
	sh "$(SCRIPTS)/watch.sh" $(BASE) $(COMMAND)
