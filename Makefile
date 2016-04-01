build:
	npm run compile
	cp README.md LICENSE ./lib/

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
