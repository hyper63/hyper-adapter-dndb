// deno-lint-ignore-file no-unused-vars

import { adapter } from "./adapter.js";
import { assertEquals } from "./dev_deps.js";

function Datastore(config) {
  return Object.freeze({
    insert: (doc) => Promise.resolve(doc),
    findOne: ({ _id }) => {
      if (_id === "1") {
        return Promise.resolve({ _id: "1", hello: "world" });
      } else if (_id === "movie-4") {
        return Promise.resolve({
          _id: "movie-4",
          type: "movie",
          title: "what about bob?",
        });
      } else {
        return Promise.resolve(null);
      }
    },
    updateOne: (criteria, action) => {
      return Promise.resolve(action.$set);
    },
    removeOne: (o) => Promise.resolve(o),
    find: () =>
      Promise.resolve([
        { _id: "movie-1", type: "movie", title: "ghostbusters" },
        { _id: "movie-2", type: "movie", title: "great outdoors" },
        { _id: "movie-3", type: "movie", title: "groundhog day" },
        { _id: "movie-4", type: "movie", title: "what about bob?" },
        { _id: "movie-5", type: "movie", title: "spaceballs" },
      ]),
    update: (criteria, action) => Promise.resolve(action.$set),
    remove: (critera) => Promise.resolve({ ok: true }),
  });
}

const test = Deno.test;
const a = adapter({ filename: "./test.db" }, Datastore);

test("create database", async () => {
  const result = await a.createDatabase("foo");
  console.log(result);
  assertEquals(result.ok, true);
});

test("remove database", async () => {
  // Error will throw if db file is not found, we want to return true
  // because the fact it is not found means that it does not exist, therefore removed.
  const result = await a.removeDatabase("foo").catch((_) => ({ ok: true }));
  assertEquals(result.ok, true);
});

test("create document", async () => {
  const result = await a.createDocument({
    db: "foo",
    id: "2",
    doc: { hello: "world" },
  });
  console.log(result);
  assertEquals(result.ok, true);
});

test("retrieve document", async () => {
  const result = await a.retrieveDocument({
    db: "foo",
    id: "1",
  });

  assertEquals(result.id, "1");
});

test("update document", async () => {
  const result = await a.updateDocument({
    db: "foo",
    id: "1",
    doc: { id: "1", hello: "moon" },
  });
  assertEquals(result.ok, true);
});

test("remove document", async () => {
  const result = await a.removeDocument({
    db: "foo",
    id: "1",
  });
  assertEquals(result.ok, true);
});

test("list documents", async () => {
  const result = await a.listDocuments({ db: "foo" });
  assertEquals(result.ok, true);
});

test("query documents", async () => {
  await a.createDocument({
    db: "foo",
    id: "movie-1",
    doc: { id: "movie-1", type: "movie", title: "Great Outdoors" },
  });

  const result = await a.queryDocuments({
    db: "foo",
    query: {
      selector: { type: "movie" },
    },
  });

  assertEquals(result.ok, true);
});

test("query documents - with fields", async () => {
  await a.createDocument({
    db: "foo",
    id: "movie-1",
    doc: { id: "movie-1", type: "movie", title: "Great Outdoors" },
  });

  const result = await a.queryDocuments({
    db: "foo",
    query: {
      selector: { type: "movie" },
      fields: ["title"],
    },
  });
  assertEquals(result.ok, true);
  assertEquals(result.docs[0].title, "ghostbusters");
});

test("query documents - with sort", async () => {
  await a.createDocument({
    db: "foo",
    id: "movie-1",
    doc: { id: "movie-1", type: "movie", title: "Great Outdoors" },
  });

  const result = await a.queryDocuments({
    db: "foo",
    query: {
      selector: { type: "movie" },
      sort: [{ type: "ASC" }, { title: "DESC" }],
    },
  });
  assertEquals(result.ok, true);
  assertEquals(result.docs[0].title, "what about bob?");
});

test("index documents", async () => {
  const result = await a.indexDocuments({
    db: "foo",
    name: "fooIndex",
    fields: ["type"],
  });
  assertEquals(result.ok, true);
});

test("bulk update/insert/remove documents", async () => {
  const result = await a.bulkDocuments({
    db: "foo",
    docs: [
      { id: "movie-1", type: "movie", title: "ghostbusters", _deleted: true },
      { id: "movie-2", type: "movie", title: "great outdoors" },
      { id: "movie-3", type: "movie", title: "groundhog day" },
      { id: "movie-4", type: "movie", title: "what about bob?" },
      { id: "movie-5", type: "movie", title: "spaceballs" },
    ],
  });

  assertEquals(result.ok, true);
});
