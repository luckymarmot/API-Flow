identifier=com.luckymarmot.PawExtensions.API-Flow
extensions_dir=$(HOME)/Library/Containers/com.luckymarmot.Paw/Data/Library/Application Support/com.luckymarmot.Paw/Extensions/

build:
	npm run build
	cp README.md LICENSE ./build/$(identifier)/

clean:
	rm -Rf ./build/

install: clean build
	mkdir -p "$(extensions_dir)$(identifier)/"
	cp -r ./build/$(identifier)/* "$(extensions_dir)$(identifier)/"

test:
	npm test

lint:
	./node_modules/eslint/bin/eslint.js -c linting/dev.yaml src/

archive: build
	cd ./build/; zip -r API-Flow.zip "$(identifier)/"
