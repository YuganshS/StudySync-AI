// app/api/signup/route.js
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Basic validation
    if (!email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Password validation (simple: at least 6 characters)
    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Signup Error:', error);
    if (error?.code === 8000 || /authentication failed|bad auth/i.test(error?.message || '')) {
      return NextResponse.json(
        {
          message: 'Database authentication failed. Check the MongoDB username and password in MONGODB_URI, and URL-encode special characters in the password.',
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ message: 'An internal server error occurred' }, { status: 500 });
  }
}
