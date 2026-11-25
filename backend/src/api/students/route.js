// backend/src/api/students/route.js
import clientPromise from "../../lib/mongodb.js";
import { ObjectId } from 'mongodb';

export default () => async (req, res) => {
  const dbName = process.env.DB_NAME || process.env.MONGODB_DB || 'studysync';
  const collectionName = 'students';

  if (req.method === 'GET') {
    try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const { teacherEmail } = req.query;

      let query = {};
      if (teacherEmail) {
        query.teacherEmail = teacherEmail;
      }

      const students = await db.collection(collectionName).find(query).sort({ createdAt: -1 }).toArray();
      return res.status(200).json(students);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      return res.status(500).json({ error: 'Failed to fetch students' });
    }
  }

  if (req.method === 'POST') {
    try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const body = req.body;

      if (Array.isArray(body.students)) {
        const { students, teacherEmail } = body;
        const validStudents = students
          .filter(s => s.name && s.email)
          .map(s => ({
            name: s.name.trim(),
            email: s.email.trim().toLowerCase(),
            phone: s.phone ? s.phone.trim() : '',
            grade: s.grade || '10th Grade',
            rollNumber: s.rollNumber || '',
            status: s.status || 'active',
            teacherEmail: teacherEmail || 'anonymous',
            materialsAccessed: 0,
            createdAt: new Date(),
          }));

        if (validStudents.length === 0) {
          return res.status(400).json({ error: 'No valid students provided' });
        }

        const result = await db.collection(collectionName).insertMany(validStudents);
        return res.status(201).json({
          success: true,
          count: result.insertedCount,
          message: `${result.insertedCount} students enrolled successfully`
        });
      }

      const { name, email, phone, grade, rollNumber, teacherEmail, status } = body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const newStudent = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : '',
        grade: grade || '10th Grade',
        rollNumber: rollNumber || '',
        status: status || 'active',
        teacherEmail: teacherEmail || 'anonymous',
        materialsAccessed: 0,
        createdAt: new Date(),
      };

      const result = await db.collection(collectionName).insertOne(newStudent);
      return res.status(201).json({ _id: result.insertedId, ...newStudent });
    } catch (error) {
      console.error('Failed to register student:', error);
      return res.status(500).json({ error: 'Failed to register student' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const { id } = req.params;
      const { ids } = req.body || {};

      if (id && ObjectId.isValid(id)) {
        const result = await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) });
        return res.status(200).json({ success: true, count: result.deletedCount });
      }

      if (Array.isArray(ids) && ids.length > 0) {
        const validIds = ids.filter(ObjectId.isValid).map(i => new ObjectId(i));
        const result = await db.collection(collectionName).deleteMany({ _id: { $in: validIds } });
        return res.status(200).json({ success: true, count: result.deletedCount });
      }

      return res.status(400).json({ error: 'Invalid delete request' });
    } catch (error) {
      console.error('Failed to delete student:', error);
      return res.status(500).json({ error: 'Failed to delete student' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};
