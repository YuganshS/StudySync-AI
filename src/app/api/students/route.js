import dbConnect from '@/lib/dbConnect';
import Student from '@/models/Student';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const teacherEmail = searchParams.get('teacherEmail');

    let query = {};
    if (teacherEmail) {
      query.teacherEmail = teacherEmail;
    }

    const students = await Student.find(query).sort({ createdAt: -1 });
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Check if bulk registration
    if (Array.isArray(body.students)) {
      const { students, teacherEmail } = body;
      if (!teacherEmail) {
        return NextResponse.json({ error: 'Teacher email is required' }, { status: 400 });
      }

      const validStudents = students
        .filter(s => s.name && s.email)
        .map(s => ({
          name: s.name.trim(),
          email: s.email.trim().toLowerCase(),
          phone: s.phone ? s.phone.trim() : '',
          grade: s.grade || '10th Grade',
          rollNumber: s.rollNumber || '',
          status: s.status || 'active',
          teacherEmail,
          materialsAccessed: 0,
        }));

      if (validStudents.length === 0) {
        return NextResponse.json({ error: 'No valid students provided' }, { status: 400 });
      }

      // Insert all
      const inserted = await Student.insertMany(validStudents, { ordered: false });
      return NextResponse.json({
        success: true,
        count: inserted.length,
        students: inserted,
        message: `${inserted.length} students enrolled successfully`
      }, { status: 201 });
    }

    // Single student registration
    const { name, email, phone, grade, rollNumber, teacherEmail, status } = body;
    if (!name || !email || !teacherEmail) {
      return NextResponse.json({ error: 'Name, email, and teacher email are required' }, { status: 400 });
    }

    const newStudent = await Student.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      grade: grade || '10th Grade',
      rollNumber: rollNumber || '',
      status: status || 'active',
      teacherEmail,
      materialsAccessed: 0,
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error('Error registering student:', error);
    return NextResponse.json({ error: error.message || 'Failed to register student' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const deleted = await Student.findByIdAndDelete(id);
      if (!deleted) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Student removed successfully' });
    }

    const body = await request.json().catch(() => ({}));
    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const result = await Student.deleteMany({ _id: { $in: body.ids } });
      return NextResponse.json({ success: true, count: result.deletedCount });
    }

    return NextResponse.json({ error: 'Missing student ID' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
