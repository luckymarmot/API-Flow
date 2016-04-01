build:
	npm run build
	cp README.md LICENSE ./lib/

clean:
	rm -Rf ./lib/

install: clean build

test:
	npm test

lint:
	npm run lint
