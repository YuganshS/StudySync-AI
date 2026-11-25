// backend/src/api/materials/route.js

import clientPromise from "../../lib/mongodb.js";
import { ObjectId } from 'mongodb';

export default () => async (req, res) => {
  if (req.method === 'GET' && req.params?.id) {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid material ID' });
      }

      const client = await clientPromise;
      const dbName = process.env.DB_NAME || process.env.MONGODB_DB || 'studysync';
      const materialsCollection = process.env.COLLECTION_NAME || 'materials';
      const material = await client.db(dbName).collection(materialsCollection).findOne(
        { _id: new ObjectId(req.params.id) },
        { projection: { fileData: 1, contentType: 1, fileName: 1 } }
      );

      if (!material?.fileData) {
        return res.status(404).json({ error: 'Stored file not found' });
      }

      res.setHeader('Content-Type', material.contentType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(material.fileName || 'download')}"`);
      return res.status(200).send(material.fileData.buffer);
    } catch (error) {
      console.error('Failed to fetch material file:', error);
      return res.status(500).json({ error: 'Failed to fetch material file' });
    }
  }

  if (req.method === 'GET') {
    try {
      const client = await clientPromise;
      const dbName = process.env.DB_NAME || process.env.MONGODB_DB || 'studysync';
      const materialsCollection = process.env.COLLECTION_NAME || 'materials';
      const db = client.db(dbName);
      const { teacherEmail } = req.query || {};

      let query = {};
      if (teacherEmail && teacherEmail.trim()) {
        const cleanEmail = teacherEmail.trim().toLowerCase();
        query = {
          $or: [
            { teacherEmail: cleanEmail },
            { uploadedBy: cleanEmail },
            { teacherEmail: teacherEmail.trim() },
            { uploadedBy: teacherEmail.trim() }
          ]
        };
      } else {
        // Strict privacy: if no teacher email provided in teacher dashboard request, return empty list
        return res.status(200).json([]);
      }

      // Find documents in the "materials" collection
      const materials = await db
        .collection(materialsCollection)
        .find(query)
        .sort({ uploadDate: -1 })
        .toArray();

      const origin = `${req.protocol}://${req.get('host')}`;
      return res.status(200).json(materials.map((material) => ({
        ...material,
        fileURL: material.fileURL || `${origin}/materials/${material._id}/file`,
      })));

    } catch (error) {
      console.error("Failed to fetch materials:", error);
      return res.status(500).json({
        error: "Failed to fetch materials",
        details: error?.message || String(error),
      });
    }
  }

  if (req.method === 'DELETE' && req.params?.id) {
    try {
      if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: 'Invalid material ID' });
      }

      const client = await clientPromise;
      const dbName = process.env.DB_NAME || process.env.MONGODB_DB || 'studysync';
      const materialsCollection = process.env.COLLECTION_NAME || 'materials';
      const db = client.db(dbName);

      const result = await db.collection(materialsCollection).deleteOne({
        _id: new ObjectId(req.params.id)
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Material not found' });
      }

      return res.status(200).json({ success: true, message: 'Material deleted successfully' });
    } catch (error) {
      console.error('Failed to delete material:', error);
      return res.status(500).json({
        error: 'Failed to delete material',
        details: error?.message || String(error)
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No material IDs provided for deletion' });
      }

      const validIds = ids.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
      if (validIds.length === 0) {
        return res.status(400).json({ error: 'No valid material IDs provided' });
      }

      const client = await clientPromise;
      const dbName = process.env.DB_NAME || process.env.MONGODB_DB || 'studysync';
      const materialsCollection = process.env.COLLECTION_NAME || 'materials';
      const db = client.db(dbName);

      const result = await db.collection(materialsCollection).deleteMany({
        _id: { $in: validIds }
      });

      return res.status(200).json({
        success: true,
        deletedCount: result.deletedCount,
        message: `${result.deletedCount} material(s) deleted successfully`
      });
    } catch (error) {
      console.error('Failed to batch delete materials:', error);
      return res.status(500).json({
        error: 'Failed to delete materials',
        details: error?.message || String(error)
      });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
