extensions_dir=$(HOME)/Library/Containers/com.luckymarmot.Paw/Data/Library/Application Support/com.luckymarmot.Paw/Extensions/

transfer: deploy
	mkdir -p "$(extensions_dir)"
	cp -r ./build/ "$(extensions_dir)"

deploy:
	sh deploy.sh

build:
	npm run compile
	cp README.md LICENSE ./lib/

build-web:
	npm run compile-web

build-node: clean
	npm run compile

clean:
	rm -Rf ./lib/

install: clean npm-install build

test:
	npm test

lint:
	npm run lint

npm-install:
	npm install

publish: install
	npm publish
