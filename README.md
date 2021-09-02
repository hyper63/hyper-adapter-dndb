<h1 align="center">hyper-adapter-dndb</h1>
<p align="center">A Data port adapter that uses DnDB in the <a href="https://hyper.io/">hyper</a>  service framework</p>
</p>
<p align="center">
  <a href="https://nest.land/package/hyper-adapter-dndb"><img src="https://nest.land/badge.svg" alt="Nest Badge" /></a>
  <a href="https://github.com/hyper63/hyper-adapter-dndb/actions/workflows/test.yml"><img src="https://github.com/hyper63/hyper-adapter-dndb/actions/workflows/test.yml/badge.svg" alt="Test" /></a>
  <a href="https://github.com/hyper63/hyper-adapter-dndb/tags/"><img src="https://img.shields.io/github/tag/hyper63/hyper-adapter-dndb" alt="Current Version" /></a>
</p>

---

## Table of Contents

- [Background](#background)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Features](#features)
- [Methods](#methods)
- [Contributing](#contributing)
- [License](#license)

## Background

dndb is a NoSQL embeddable database built for deno

https://dndb.crawford.ml/docs

## Getting Started

```js
import { default as dndb } from "https://x.nest.land/hyper-adapter-dndb@1.0.0/mod.js";

export default {
  app: opine,
  adapter: [
    {
      port: "data",
      plugins: [dndb({ dir: "/tmp" })],
    },
  ],
};
```

## Installation

This is a Deno module available to import from
[nest.land](https://nest.land/package/hyper-adapter-dndb)

deps.js

```js
export { default as dndb } from "https://x.nest.land/hyper-adapter-dndb@0.0.2/mod.js";
```

## Features

- Create a `DnDB` datastore
- Remove a `DnDB` datastore
- Create a document in a `DnDB` datastore
- Retrieve a document in a `DnDB` datastore
- Update a document in a `DnDB` datastore
- Remove a document from a `DnDB` datastore
- List documents in a `DnDB` datastore
- Query documents in a `DnDB` datastore
- Index documents in a `DnDB` datastore
- Bulk create documents in a `DnDB` datastore

## Methods

This adapter fully implements the Data port and can be used as the
[hyper Data service](https://docs.hyper.io/data-api) adapter

See the full port [here](https://nest.land/package/hyper-port-data)

## Contributing

Contributions are welcome! See the hyper
[contribution guide](https://docs.hyper.io/contributing-to-hyper)

## Testing

```
./scripts/test.sh
```

To lint, check formatting, and run unit tests

## License

Apache-2.0
