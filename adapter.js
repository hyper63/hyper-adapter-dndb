// deno-lint-ignore-file no-unused-vars

import { crocks, existsSync, R } from "./deps.js";
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
  formatError,
  handleExists,
  loadDb,
  mapResult,
  removeDb,
  setId,
  swap,
} from "./utils.js";

const ENV = Deno.env.get("DENO_ENV");
const {
  __,
  always,
  filter,
  gt,
  gte,
  includes,
  propSatisfies,
  reject,
  take,
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
        .map(swap("_id", "id"))
        .toPromise(),
    updateDocument: ({ db, id, doc }) =>
      Async.of(db)
        .chain(checkDoc(doc))
        .chain(doloadDb)
        .chain(doUpdateOne(id, swap("id", "_id")(doc)))
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
        .map((docs) => ({ ok: true, docs }))
        .toPromise(),
    indexDocuments: ({ db, name, fields }) =>
      Async.of(db)
        .map(getDbFile)
        .chain(doloadDb)
        .map(always({ ok: true }))
        .toPromise(),
    bulkDocuments: ({ db, docs }) => {
      const dbFile = dbFullname(db);
      if (ENV !== "test" && !existsSync(dbFile)) {
        return Promise.reject({
          ok: false,
          status: 404,
          msg: "database not found!",
        });
      }
      db = new Datastore({ filename: dbFile });
      return bulk({ db, docs })
        .map((results) => ({ ok: true, results }))
        .toPromise();
    },
    listDocuments: async (d) => {
      let { db } = d;
      const dbFile = dbFullname(db);
      if (ENV !== "test" && !existsSync(dbFile)) {
        return Promise.reject({
          ok: false,
          status: 404,
          msg: "database not found!",
        });
      }
      db = new Datastore({ filename: dbFile });
      let results = await db.find();

      if (d.keys) {
        results = filter(({ _id }) => includes(_id, d.keys), results);
      }

      if (d.start) {
        results = filter(propSatisfies(gte(__, d.start), "_id"), results);
      }
      if (d.end) {
        results = reject(propSatisfies(gt(__, d.end), "_id"), results);
      }
      // handle limit argument
      if (d.limit) {
        results = take(Number(d.limit), results);
      }

      return Promise.resolve({ ok: true, docs: results });
    },
  });
}
