import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const placeholderBlogs = [
  {
    id: 1,
    title: "Understanding Binary Search Beyond the Basics",
    excerpt:
      "Binary search is more than just finding an element. Let’s explore edge cases, invariants, and real interview pitfalls.",
    author: "AlgoNerd",
    readTime: "6 min read",
  },
  {
    id: 2,
    title: "Designing a Contest System Like LeetCode",
    excerpt:
      "A deep dive into schema design, ICPC scoring, penalties, and leaderboard optimizations.",
    author: "Jack Bolt",
    readTime: "8 min read",
  },
  {
    id: 3,
    title: "Why Recursion Is Still Relevant in 2026",
    excerpt:
      "Despite iterative optimizations, recursion still shines in parsing, trees, and divide & conquer problems.",
    author: "DevThinker",
    readTime: "5 min read",
  },
];

function BlogFeed() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return <div className="p-6 text-gray-500">Loading your feed...</div>;
  }

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          Hi {user.username} 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Share your knowledge and learn from the community.
        </p>
      </div>

      {/* CTA: Create Post */}
      <div className="mb-10 p-6 rounded-xl border bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-1">
            Got something to share?
          </h2>
          <p className="text-gray-600">
            Write about algorithms, system design, contest insights, or anything you’ve learned.
          </p>
        </div>

        <button
          onClick={() => navigate("/blogs/new")}
          className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
        >
          ✍️ Write a Post
        </button>
      </div>

      {/* Feed */}
      <div className="space-y-6">
        {placeholderBlogs.map((blog) => (
          <div
            key={blog.id}
            className="border rounded-xl p-6 hover:shadow-md transition cursor-pointer bg-white"
          >
            <h2 className="text-xl font-semibold mb-2">
              {blog.title}
            </h2>

            <p className="text-gray-600 mb-4">
              {blog.excerpt}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>✍️ {blog.author}</span>
              <span>⏱ {blog.readTime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BlogFeed;
