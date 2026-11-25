// backend/src/api/notices/route.js

import clientPromise from "../../lib/mongodb.js";

export default () => async (req, res) => {
  if (req.method === 'GET') {
    try {
      const client = await clientPromise;
      const db = client.db(process.env.DB_NAME || process.env.MONGODB_DB || 'StudySyncDB');
      const { teacherEmail } = req.query || {};

      let query = {};
      if (teacherEmail && teacherEmail.trim()) {
        const cleanEmail = teacherEmail.trim().toLowerCase();
        query = {
          $or: [
            { teacherEmail: cleanEmail },
            { teacherEmail: teacherEmail.trim() }
          ]
        };
      } else {
        // Strict privacy: if no teacher email provided, return empty list
        return res.status(200).json([]);
      }

      const notices = await db
        .collection("notices")
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json(notices);
    } catch (error) {
      console.error("Fetch Notices Error:", error);
      return res.status(500).json({ error: "Failed to fetch notices" });
    }
  } else if (req.method === 'POST') {
    try {
      const { title, content, category, status, priority, teacherEmail } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required" });
      }

      const client = await clientPromise;
      const db = client.db(process.env.DB_NAME || process.env.MONGODB_DB || 'StudySyncDB');

      const newNotice = {
        title,
        content,
        category: category || "general",
        priority: priority || "medium",
        status: status || "draft",
        teacherEmail: teacherEmail || '',
        createdAt: new Date(),
        publishDate: status === 'published' ? new Date() : null,
        views: 0,
      };

      const result = await db.collection("notices").insertOne(newNotice);

      return res.status(201).json({
        success: true,
        newNotice: { ...newNotice, _id: result.insertedId }
      });

    } catch (error) {
      console.error("Notice Creation Error:", error);
      return res.status(500).json({ error: "Failed to create notice" });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
