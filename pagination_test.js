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

test("pagination with adapter", async () => {
  // using limit and start, create simple prev,next pagination
  // current limit will be 2 record
  // since we will know the last item on the page we will ask for a total count of 3
  // and exclude the first item if the page num is greater than zero
  const page1 = await first(a, 2);
  const page2 = await next(a, page1[1]._id, 2);
  const page1a = await prev(a, page2[0]._id, 2);
  assertEquals(page1[0]._id, "1");
  assertEquals(page2[0]._id, "3");
  assertEquals(page1a[0]._id, "1");
});

async function first(a, limit) {
  const res = await a.listDocuments({ db: "foo", limit: Number(limit) });
  return res.docs;
}

async function next(a, id, limit) {
  const res = await a.listDocuments({
    db: "foo",
    limit: Number(limit) + 1,
    start: id,
  });
  return takeLast(limit, res.docs);
}

async function prev(a, id, limit) {
  const res = await a.listDocuments({
    db: "foo",
    limit: Number(limit) + 1,
    end: id,
  });
  return take(limit, res.docs);
}
