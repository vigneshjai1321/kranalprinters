export function createCustomerRepository(db) {
  const collection = db.collection("customers");

  return {
    async ensureIndexes() {
      await collection.createIndex({ name: 1 }, { unique: true });
    },

    async findAll() {
      return collection.find({}, { projection: { _id: 0 } }).sort({ name: 1 }).toArray();
    },

    async count() {
      return collection.countDocuments();
    },

    async insertMany(docs) {
      if (!docs.length) return;
      await collection.insertMany(docs);
    },

    async findByNameCaseInsensitive(name) {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return collection.findOne(
        { name: new RegExp(`^${escapedName}$`, "i") },
        { projection: { _id: 0 } }
      );
    },

    async insertOne(doc) {
      await collection.insertOne(doc);
      return doc;
    },
  };
}
