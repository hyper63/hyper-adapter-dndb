import { crocks, cuid, existsSync, R } from "./deps.js";

const ENV = Deno.env.get("DENO_ENV");

const {
  __,
  assoc,
  compose,
  omit,
  propOr,
  isEmpty,
  filter,
  prop,
  includes,
  identity,
  split,
  propSatisfies,
  gte,
  gt,
  reject,
  take,
  map,
  sortWith,
  ascend,
  descend,
  pluck,
} = R;

const { Async, tryCatch, resultToAsync } = crocks;

// pure functions
export const checkIfExists = (n) =>
  ENV === "test" || existsSync(n)
    ? Async.Resolved(n)
    : Async.Rejected({ ok: false, status: 400, msg: "Database not found!" });

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
export const doFindOne = (id) =>
  (db) =>
    $(db, "findOne")({ _id: id })
      .chain((doc) =>
        doc ? Async.Resolved(doc) : Async.Rejected({
          ok: false,
          status: 404,
          msg: "Document not found!",
        })
      );
// update one document
export const doUpdateOne = (id, doc) =>
  (db) => $(db, "updateOne")({ _id: id }, { $set: doc });
export const doRemoveOne = (id) => (db) => $(db, "removeOne")({ _id: id });

export const mapResult = (result) => ({ ok: true, id: result._id });

export const dbFullname = (env) => (n) => `${propOr(".", "dir", env)}/${n}.db`;

export const createDb = (env, Datastore) =>
  (name) =>
    Async.of(name)
      .map(dbFullname(env))
      .chain(
        resultToAsync(
          tryCatch((fn) => new Datastore({ filename: fn, autoload: true })),
        ),
      );

export const loadDb = (env, Datastore) =>
  (name) =>
    Async.of(name)
      .map(dbFullname(env))
      .chain(checkIfExists)
      .chain(
        resultToAsync(
          tryCatch((fn) => new Datastore({ filename: fn })),
        ),
      );

export const checkDoc = (doc) =>
  (db) =>
    isEmpty(doc)
      ? Async.Rejected({
        ok: false,
        status: 400,
        msg: "empty document not allowed",
      })
      : Async.Resolved(db);

export const filterKeys = (keys) =>
  keys
    ? filter(compose(includes(__, split(",", keys)), prop("_id")))
    : identity;

export const filterStart = (start) =>
  start ? filter(propSatisfies(gte(__, start), "_id")) : identity;

export const filterEnd = (end) =>
  end ? reject(propSatisfies(gt(__, end), "_id")) : identity;

export const limitDocs = (limit) => limit ? take(limit) : take(1000);

export const omitInternalIds = map(omit(["_id"]));

export const sortDocs = (descending) =>
  descending ? sortWith([descend(prop("id"))]) : sortWith([ascend(prop("id"))]);

export const pluckDocs = (fields) => fields ? pluck(fields) : identity;
export const sortDocsBy = (sort) =>
  sort
    ? sortWith(
      map(
        compose(
          ([k, v]) => v === 'DESC' ? descend(prop(k)) : ascend(prop(k)),
          flatten,
          toPairs
        ), sort
      ),
    )
    : identity;
