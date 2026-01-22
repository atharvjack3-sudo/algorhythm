import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AuthForm() {
  const { login, signup, user, loading: authLoading } = useAuth();
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  useEffect(() => {
    if (!authLoading && user) navigate("/problemset");
  }, [authLoading, user]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await signup(form.username, form.email, form.password);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex justify-center items-center w-screen h-screen min-w-200 min-h-175">
      <div className="w-[80%] h-[75%] relative flex overflow-hidden rounded-xl border border-blue-300 shadow-xl">
        {/* Sliding Dark Panel */}
        <div
          className={`absolute z-10 w-1/2 h-full bg-slate-800 flex flex-col justify-center items-center
          transition-all duration-500
          ${
            mode === "login"
              ? "translate-x-full rounded-br-xl rounded-tr-xl"
              : "translate-x-0 rounded-bl-xl rounded-tl-xl"
          }`}
        >
          {mode === "login" ? (
            <>
              <p className="text-2xl font-semibold text-white text-center">
                New here at <span className="text-sky-400">Algorhythm</span> ?
              </p>
              <p className="mt-4 text-gray-300">
                Click below to{" "}
                <span className="font-semibold text-sky-400">Sign up</span>
              </p>
              <button
                onClick={() => setMode("signup")}
                className="mt-10 h-11 px-10 border-2 border-sky-400 rounded-lg
                text-white font-semibold hover:bg-sky-400 transition"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              <p className="text-2xl font-semibold text-white text-center">
                Already a member at <br />
                <span className="text-sky-400">Algorhythm</span>?
              </p>
              <p className="mt-4 text-gray-300">
                Click below to{" "}
                <span className="font-semibold text-sky-400">Log in</span>
              </p>
              <button
                onClick={() => {console.log("LOGIN CLICKED");setMode("login");}}
                className="mt-10 h-11 px-10 border-2 border-sky-400 rounded-lg
                text-white font-semibold hover:bg-sky-400 transition"
              >
                Log in
              </button>
            </>
          )}
        </div>

        {/* Login Panel */}
        <div className="w-1/2 h-full flex flex-col">
          <p className="mt-6 text-3xl font-semibold text-sky-500 text-center">
            LOG IN
          </p>

          <form
            onSubmit={submit}
            className="flex flex-col justify-center h-full px-20"
          >
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              className="mt-2 h-11 px-4 rounded-lg border border-gray-300
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400
              outline-none transition"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <label className="mt-6 text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-2 h-11 px-4 rounded-lg border border-gray-300
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400
              outline-none transition"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <button
              type="submit"
              className="mt-10 h-11 w-full max-w-xs self-center
              bg-sky-500 text-white font-semibold rounded-lg
              hover:bg-sky-600 active:scale-[0.98] transition"
            >
              Log In
            </button>
          </form>
        </div>

        {/* Signup Panel */}
        <div className="w-1/2 h-full flex flex-col">
          <p className="mt-6 text-3xl font-semibold text-sky-500 text-center">
            SIGN UP
          </p>

          <form
            onSubmit={submit}
            className="flex flex-col justify-center h-full px-20"
          >
            <label className="text-sm font-medium text-gray-600">
              Username
            </label>
            <input
              placeholder="handle"
              className="mt-2 h-11 px-4 rounded-lg border border-gray-300
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400
              outline-none transition"
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            <label className="mt-6 text-sm font-medium text-gray-600">
              Email
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              className="mt-2 h-11 px-4 rounded-lg border border-gray-300
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400
              outline-none transition"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <label className="mt-6 text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-2 h-11 px-4 rounded-lg border border-gray-300
              focus:ring-2 focus:ring-sky-400 focus:border-sky-400
              outline-none transition"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <button
              type="submit"
              className="mt-10 h-11 w-full max-w-xs self-center
              bg-sky-500 text-white font-semibold rounded-lg
              hover:bg-sky-600 active:scale-[0.98] transition"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
