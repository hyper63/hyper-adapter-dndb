// deno-lint-ignore-file no-unused-vars

import { crocks, R } from "./deps.js";
import { bulk } from "./bulk.js";

import {
  checkDoc,
  createDb,
  dbFullname,
  doFind,
  doFindOne,
  doInsert,
  doRemoveOne,
  doUpdateOne,
  filterEnd,
  filterKeys,
  filterStart,
  formatError,
  handleExists,
  limitDocs,
  loadDb,
  mapResult,
  pluckDocs,
  removeDb,
  setId,
  sortDocs,
  sortDocsBy,
} from "./utils.js";

const ENV = Deno.env.get("DENO_ENV");
const {
  always,
  map,
  over,
  lensProp,
} = R;
const { Async } = crocks;

export function adapter(env, Datastore) {
  // helper functions
  const getDbFile = dbFullname(env);
  const doloadDb = loadDb(env, Datastore);
  const doCreateDb = createDb(env, Datastore);

  return Object.freeze({
    createDatabase: (name) =>
      doCreateDb(name)
        .bimap(formatError, always({ ok: true }))
        .toPromise(),
    removeDatabase: (name) =>
      Async.of(name)
        .map(getDbFile)
        .chain(removeDb)
        .bimap(formatError, always({ ok: true }))
        .toPromise(),
    createDocument: ({ db, id, doc }) =>
      Async.of(db)
        .chain(checkDoc(doc))
        .chain(doloadDb)
        .map(setId(id, doc))
        .chain(handleExists)
        .chain(doInsert)
        .map(mapResult)
        .toPromise(),
    retrieveDocument: ({ db, id }) =>
      Async.of(db)
        .chain(doloadDb)
        .chain(doFindOne(id))
        .toPromise(),
    updateDocument: ({ db, id, doc }) =>
      Async.of(db)
        .chain(checkDoc(doc))
        .chain(doloadDb)
        .chain(doUpdateOne(id, doc))
        .map(always({ ok: true }))
        .toPromise(),
    removeDocument: ({ db, id }) =>
      Async.of(db)
        .chain(doloadDb)
        .chain(doRemoveOne(id))
        .map(always({ ok: true, id }))
        .toPromise(),
    queryDocuments: ({ db, query }) =>
      Async.of(db)
        .chain(doloadDb)
        .chain(doFind(query))
        .map(pluckDocs(query.fields))
        .map(sortDocsBy(query.sort))
        .map(limitDocs(query.limit))
        .map((docs) => ({ ok: true, docs }))
        .toPromise(),
    indexDocuments: ({ db, name, fields }) =>
      Async.of(db)
        .chain(doloadDb)
        .map(always({ ok: true }))
        .toPromise(),
    listDocuments: ({ db, keys, startkey, endkey, limit, descending }) =>
      Async.of(db)
        .chain(doloadDb)
        .chain(doFind({ selector: {} }))
        .map(filterKeys(keys))
        .map(filterStart(startkey))
        .map(filterEnd(endkey))
        .map(sortDocs(descending))
        .map(limitDocs(limit))
        .map((docs) => ({ ok: true, docs }))
        .toPromise(),
    bulkDocuments: ({ db, docs }) =>
      Async.of(db)
        .chain(doloadDb)
        .map((db) => ({ db, docs }))
        .map(over(
          lensProp("docs"),
          map((doc) => ({
            ...doc,
            _id: doc._id || doc.id,
          })),
        ))
        .chain(bulk)
        .map((results) => ({ ok: true, results }))
        .toPromise(),
  });
}
