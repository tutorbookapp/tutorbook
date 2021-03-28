extract:
	npx firestore-export -a covid-tutoring-admin.json -b default.json -p
clean:
	node anonymize.js
import:
	npx firestore-import -a test-covid-tutoring-admin.json -b test.json
all:
	make extract && make clean && make import
