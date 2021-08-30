import { crocks, cuid, R } from "./deps.js";

const {
  assoc,
  compose,
  omit,
  propOr,
} = R;

const { Async, tryCatch, resultToAsync } = crocks;

// pure functions
export const swap = (a, b) =>
  compose(omit([a]), (doc) => assoc(b, doc[a], doc));
export const removeDb = (name) =>
  Async.fromPromise(Deno.remove.bind(Deno))(name);
export const formatError = (e) => ({ ok: false, message: e.message });
// invoke dndb method
export const $ = (p, method) => Async.fromPromise(p[method].bind(p));
// on create document, if a doc exists return 409
export const handleExists = ({ db, doc }) =>
  $(db, "findOne")({ _id: doc._id })
    .chain((result) =>
      result
        ? Async.Rejected({ ok: false, status: 409, msg: "Document Conflict" })
        : Async.Resolved({ db, doc })
    );
// generate a unique id if id not supplied.
export const setId = (id, doc) =>
  (db) => ({ db, doc: assoc("_id", id || cuid(), doc) });
// insert document
export const doInsert = ({ db, doc }) => $(db, "insert")(doc);
export const doFind = (query) => (db) => $(db, "find")(query.selector);
// find one document
export const doFindOne = (id) => (db) => $(db, "findOne")({ _id: id });
// update one document
export const doUpdateOne = (id, doc) =>
  (db) => $(db, "updateOne")({ _id: id }, { $set: doc });
export const doRemoveOne = (id) => (db) => $(db, "removeOne")({ _id: id });

export const mapResult = (result) => ({ ok: true, id: result._id });

export const dbFullname = (env) => (n) => `${propOr(".", "dir", env)}/${n}.db`;

export const loadDb = (env, Datastore) =>
  (name) =>
    Async.of(name)
      .chain(
        resultToAsync(
          tryCatch(() =>
            new Datastore({ filename: dbFullname(env)(name), autoload: true })
          ),
        ),
      );
