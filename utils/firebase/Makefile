extract:
	npx firestore-export -a covid-tutoring-admin.json -b default.json -n partitions/default -p
clean:
	node anonymize.js
import:
	npx firestore-import -a test-covid-tutoring-admin.json -b test.json -n partitions/test

all:
	make extract && make clean && make import
