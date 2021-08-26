// deno-lint-ignore-file no-unused-vars

import { cuid, R } from "./deps.js";
import { bulk } from "./bulk.js";

const {
  __,
  assoc,
  compose,
  equals,
  filter,
  gt,
  gte,
  includes,
  omit,
  propOr,
  propSatisfies,
  reject,
  take,
} = R;
const toInternalId = compose(omit(["id"]), (doc) => assoc("_id", doc.id, doc));

let db = null;
export function adapter(env, Datastore) {
  // create _system json file to hold all db names
  const dataDir = propOr(".", "dir", env);
  const dbFullname = (n) => `${dataDir}/${n}.db`;

  return Object.freeze({
    createDatabase: (name) => {
      try {
        db = new Datastore({ filename: dbFullname(name), autoload: true });
      } catch (e) {
        return Promise.resolve({ ok: false, message: e.message });
      }
      return Promise.resolve({ ok: true });
    },
    removeDatabase: async (name) => {
      // todo delete file if exists
      try {
        await Deno.remove(dbFullname(name));
      } catch (e) {
        console.log(e.message);
      }
      return Promise.resolve({ ok: true });
    },
    createDocument: async ({ db, id, doc }) => {
      if (!db) {
        return Promise.reject({ ok: false, msg: "database not found!" });
      }
      db = new Datastore({ filename: dbFullname(db) });
      doc._id = id || cuid();
      const result = await db.insert(doc);
      return Promise.resolve({ ok: equals(result, doc), id: result._id });
    },
    retrieveDocument: async ({ db, id }) => {
      if (!db) {
        return Promise.reject({ ok: false, msg: "database not found!" });
      }
      db = new Datastore({ filename: dbFullname(db) });
      const doc = await db.findOne({ _id: id });
      // swap ids
      return Promise.resolve(compose(omit(["_id"]), assoc("id", doc._id))(doc));
    },
    updateDocument: async ({ db, id, doc }) => {
      if (!db) {
        return Promise.reject({ ok: false, msg: "database not found!" });
      }
      db = new Datastore({ filename: dbFullname(db) });
      // swap ids
      doc = toInternalId(doc);
      await db.updateOne({ _id: id }, { $set: doc });
      return Promise.resolve({ ok: true });
    },
    removeDocument: async ({ db, id }) => {
      if (!db) {
        return Promise.reject({ ok: false, msg: "database not found!" });
      }
      db = new Datastore({ filename: dbFullname(db) });
      const result = await db.removeOne({ _id: id });
      if (!result) return Promise.resolve({ ok: false, message: "not found" });
      return Promise.resolve({ ok: equals(result._id, id) });
    },
    listDocuments: async (d) => {
      let { db } = d;
      if (!db) {
        return Promise.reject({ ok: false, msg: "database not found!" });
      }
      db = new Datastore({ filename: dbFullname(db) });
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
    queryDocuments: async ({ db, query }) => {
      if (!db) {
        return Promise.reject({ ok: false, msg: "database not found!" });
      }
      db = new Datastore({ filename: dbFullname(db) });
      const results = await db.find(query.selector);
      return Promise.resolve({ ok: true, docs: results });
    },
    indexDocuments: ({ db, name, fields }) => {
      if (!db) {
        return Promise.reject({ ok: false, msg: "database not found!" });
      }
      // noop - db is not built for
      // optimizability yet! will add this when
      // supported
      return Promise.resolve({ ok: true });
    },
    bulkDocuments: ({ db, docs }) => {
      if (!db) {
        return Promise.reject({ ok: false, msg: "database not found!" });
      }
      db = new Datastore({ filename: dbFullname(db) });
      return bulk({ db, docs })
        .map((results) => ({ ok: true, results }))
        .toPromise();
    },
  });
}
