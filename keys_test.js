// deno-lint-ignore-file no-unused-vars

import { adapter } from "./adapter.js";
import { R } from "./deps.js";
import { assertEquals } from "./dev_deps.js";

const { head, last, prop, take, takeLast } = R;

function Datastore(config) {
  const docs = [
    {
      _id: "1",
      type: "movie",
      title: "Ghostbusters",
      dateAdded: "2021-08-01",
    },
    {
      _id: "2",
      type: "movie",
      title: "Groundhog Day",
      dateAdded: "2021-08-02",
    },
    {
      _id: "3",
      type: "movie",
      title: "Avengers",
      dateAdded: "2021-08-03",
    },
    {
      _id: "4",
      type: "movie",
      title: "Batman",
      dateAdded: "2021-08-04",
    },
    {
      _id: "5",
      type: "movie",
      title: "Superman",
      dateAdded: "2021-08-05",
    },
    {
      _id: "6",
      type: "movie",
      title: "Hulk",
      dateAdded: "2021-08-06",
    },
    {
      _id: "7",
      type: "movie",
      title: "Captain America",
      dateAdded: "2021-08-07",
    },
    {
      _id: "8",
      type: "movie",
      title: "Black Widow",
      dateAdded: "2021-08-08",
    },
  ];

  return Object.freeze({
    insert: (doc) => Promise.resolve(doc),
    findOne: (o) => Promise.resolve({ _id: "1", hello: "world" }),
    updateOne: (criteria, action) =>
      Promise.resolve({ _id: "1", hello: "moon" }),
    removeOne: (o) => Promise.resolve(o),
    find: () => Promise.resolve(docs),
    update: (criteria, action) => Promise.resolve(action.$set),
  });
}

const test = Deno.test;
const a = adapter({ filename: "./test.db" }, Datastore);

test("keys with adapter", async () => {
  const res = await a.listDocuments({ db: "foo", keys: "1,3,5" });
  assertEquals(res.docs.length, 3);
  assertEquals(res.docs[0]._id, "1");
  assertEquals(res.docs[2]._id, "5");
});
