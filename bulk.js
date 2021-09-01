// deno-lint-ignore-file no-unused-vars

import { crocks, R } from "./deps.js";

const {
  assoc,
  compose,
  identity,
  ifElse,
  isNil,
  map,
  omit,
  pick,
  prop,
  propEq,
} = R;
const { Async } = crocks;

export function bulk({ db, docs }) {
  const remove = (doc) =>
    Async.of(doc)
      .map(pick(["_id"]))
      .chain(Async.fromPromise(db.removeOne.bind(db)))
      .map((r) => ({ ok: true, id: doc._id, deleted: true }));

  const isDeleted = propEq("_deleted", true);
  const isNew = propEq("_new", true);

  const insert = compose(
    map((r) => ({ ok: true, id: r._id })),
    Async.fromPromise(db.insert.bind(db)),
    omit(["_new"]),
  );
  const update = (doc) =>
    Async.fromPromise(db.updateOne.bind(db))({ _id: doc._id }, { $set: doc })
      .map((r) => ({ ok: true, id: doc._id, updated: true }));

  const findOne = Async.fromPromise(db.findOne.bind(db));
  const flagNew = (doc) =>
    ifElse(isNil, () => assoc("_new", true, doc), () => doc);

  return Async.of(docs)
    // findAll updates
    .chain(compose(
      Async.all,
      map((doc) =>
        compose(
          map(flagNew(doc)),
          findOne,
          pick(["_id"]),
        )(doc)
      ),
    ))
    .chain(compose(
      Async.all,
      map(
        ifElse(isDeleted, remove, ifElse(isNew, insert, update)),
      ),
      (v) => (console.log(v), v),
    ));
}
