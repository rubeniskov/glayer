PROJECT_NAME := $(shell node_modules/.bin/miniquery -p 'name' ./package.json)

BROWSERIFY_FLAGS = \
./index.js \
--standalone $(PROJECT_NAME) \
--debug \
--outfile ./dist/bundle.js \
--verbose

BABEL_FLAGS = \
src \
--out-dir lib \
--copy-files

UGLIFYJS_FLAGS = \
--output ./dist/bundle.min.js \
--compress \
--mangle \
--screw-ie8 \
--stats \
--mangle-props \
--verbose

all: clean build_emcc

watch:
	make watch_babel &
	make watch_browser &

watch_babel:
	mkdir -p ./dist/ ./lib/
	./node_modules/.bin/babel --watch $(BABEL_FLAGS)

watch_browser:
	mkdir -p ./dist/ ./lib/
	./node_modules/.bin/watchify $(BROWSERIFY_FLAGS)

compile: essentials compile_node compile_browser compress_browser

compile_babel:
	mkdir -p ./lib/
	./node_modules/.bin/babel $(BABEL_FLAGS)

compile_browser:
	mkdir -p ./dist/
	./node_modules/.bin/browserify $(BROWSERIFY_FLAGS)

compress_browser: compile
	cat ./dist/bundle.js \
	| ./node_modules/uglifyjs/bin/uglifyjs $(UGLIFYJS_FLAGS)

release: release_major

publish: release_major

release_minor:
	./node_modules/.bin/npm-bump minor

release_major:
	./node_modules/.bin/npm-bump major

patch:
	./node_modules/.bin/npm-bump patch

clean:
	@rm -rf ./dist/
