# API Implementation

These directories contain the core of our back-end API implementation:

1. The actual API route definitions are housed in this directory.
2. All API route logic is packaged neatly into reusable "component" functions
   which are organized in the subdirectories found here.

## API Route Definitions

The actual API route definitions merely import and call a series of "component"
functions in a certain order.

For example, this could be the definition of the `POST /api/matches` endpoint:

```typescript
const createMatch = route<MatchJSON>((req, res) => {
  verify(body<MatchJSON>, isMatchJSON);
  verify(auth);
  verify(timeWithinAvailability);
  verify(subjectsCanBeTutored);
  create(zoomMeeting);
  create(matchDocument);
  send(matchEmail);
});
```

There are a couple of things to break down here:

### `verify`

This is a high-level route component that performs checks on the API request and
the data that it will create or modify.

**Parameters**

- `(req, res) => Promise<boolean>` The checker function. It should take in (at
  least) the `Request` and `Response` objects, perform it's checks, and return
  a boolean (`true` if the request is valid and `false` if it has an error).
- `...args: any[]` Any other arguments to pass unto the checker function.

**API Route Components**
All of our back-end logic is packaged neatly into reusable
