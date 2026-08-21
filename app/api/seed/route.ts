import { NextResponse } from "next/server";
import { auth, db } from "@/firebase/admin";

const MOCK_USERS = [
  {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    password: "Password123!",
  },
  {
    name: "Sarah Parker",
    email: "sarah.parker@example.com",
    password: "Password123!",
  },
  {
    name: "Michael Chen",
    email: "michael.chen@example.com",
    password: "Password123!",
  },
];

const MOCK_INTERVIEWS = [
  {
    role: "Frontend Developer",
    type: "Technical",
    level: "Senior",
    techstack: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    questions: [
      "Explain the difference between Server Components and Client Components in Next.js App Router.",
      "How do you optimize render performance in a large-scale React application?",
      "What is closure in JavaScript and how is it used in custom React hooks?",
    ],
    finalized: true,
    coverImage: "/adobe.png",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    role: "Full Stack Engineer",
    type: "Mixed",
    level: "Mid",
    techstack: ["Node.js", "Express", "MongoDB", "React"],
    questions: [
      "How do you structure authentication using JWTs vs Session cookies in Express?",
      "Explain database indexing in MongoDB and when you should use compound indexes.",
      "Describe how you handle state management across complex fullstack applications.",
    ],
    finalized: true,
    coverImage: "/amazon.png",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    role: "Backend Developer",
    type: "Technical",
    level: "Junior",
    techstack: ["Python", "Django", "PostgreSQL"],
    questions: [
      "What is the difference between select_related and prefetch_related in Django ORM?",
      "How do RESTful API principles guide endpoint design?",
      "Explain ACID properties in relational databases.",
    ],
    finalized: true,
    coverImage: "/spotify.png",
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  if (!auth || !db) {
    return NextResponse.json(
      {
        success: false,
        message: "Firebase Admin is not configured. Check your .env.local file.",
      },
      { status: 500 }
    );
  }

  const createdUsers = [];

  try {
    for (const mockUser of MOCK_USERS) {
      let uid: string;

      try {
        const existingUser = await auth.getUserByEmail(mockUser.email);
        uid = existingUser.uid;
      } catch (e) {
        // User does not exist, create in Firebase Auth
        const newUser = await auth.createUser({
          email: mockUser.email,
          password: mockUser.password,
          displayName: mockUser.name,
        });
        uid = newUser.uid;
      }

      // Save or update user document in Firestore
      await db.collection("users").doc(uid).set(
        {
          name: mockUser.name,
          email: mockUser.email,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      createdUsers.push({
        uid,
        name: mockUser.name,
        email: mockUser.email,
        password: mockUser.password,
      });

      // Seed mock interviews for this user
      for (const mockInterview of MOCK_INTERVIEWS) {
        // Check if mock interview already exists to avoid duplicates
        const existingInterviews = await db
          .collection("interviews")
          .where("userId", "==", uid)
          .where("role", "==", mockInterview.role)
          .get();

        if (existingInterviews.empty) {
          await db.collection("interviews").add({
            ...mockInterview,
            userId: uid,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Mock users and sample interviews added successfully!",
      users: createdUsers,
    });
  } catch (error: any) {
    console.error("Error seeding mock users:", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
