export function createJobRepository(db) {
  const collection = db.collection("jobs");
  const safeProjection = { _id: 0 };

  return {
    async ensureIndexes() {
      await Promise.all([
        collection.createIndex({ id: 1 }, { unique: true }),
        collection.createIndex({ job_no: 1 }, { unique: true }),
        collection.createIndex({ customer_name: 1 }),
        collection.createIndex({ status: 1 }),
        collection.createIndex({ last_updated_at: -1 }),
      ]);
    },

    async findAll() {
      return collection.find({}, { projection: safeProjection }).sort({ id: 1 }).toArray();
    },

    async findById(id) {
      return collection.findOne({ id }, { projection: safeProjection });
    },

    async findPaginated({ page = 1, limit = 25, status, customerName }) {
      const normalizedPage = Math.max(1, Number(page) || 1);
      const normalizedLimit = Math.max(1, Math.min(200, Number(limit) || 25));
      const query = {};

      if (status) query.status = status;
      if (customerName) query.customer_name = customerName;

      const [items, total] = await Promise.all([
        collection
          .find(query, { projection: safeProjection })
          .sort({ id: 1 })
          .skip((normalizedPage - 1) * normalizedLimit)
          .limit(normalizedLimit)
          .toArray(),
        collection.countDocuments(query),
      ]);

      return {
        items,
        total,
        page: normalizedPage,
        limit: normalizedLimit,
        pages: Math.max(1, Math.ceil(total / normalizedLimit)),
      };
    },

    async count() {
      return collection.countDocuments();
    },

    async insertMany(docs) {
      if (!docs.length) return;
      await collection.insertMany(docs);
    },

    async insertOne(doc) {
      await collection.insertOne(doc);
      return doc;
    },

    async updateById(id, doc) {
      const result = await collection.updateOne({ id }, { $set: doc });
      return result.matchedCount > 0;
    },

    async deleteById(id) {
      const result = await collection.deleteOne({ id });
      return result.deletedCount > 0;
    },
  };
}
