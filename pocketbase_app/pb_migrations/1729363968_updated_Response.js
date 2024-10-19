/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("mopu8mzkegy8heg")

  collection.createRule = "@request.auth.id != \"\""
  collection.deleteRule = "@request.auth.id != \"\""

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("mopu8mzkegy8heg")

  collection.createRule = null
  collection.deleteRule = null

  return dao.saveCollection(collection)
})