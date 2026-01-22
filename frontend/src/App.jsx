import "./App.css";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthForm from "./components/AuthForm";
import Dashboard from "./pages/Dashboard";
import SolveProblem from "./pages/SolveProblem";
import Landing from "./pages/Landing";
import ProblemSet from "./pages/Problemset";
import Premium from "./pages/Premium";
import MyList from "./pages/MyList";
import DiscussionDetail from "./components/discussion/DiscussionDetail";
import Contests from "./pages/Contests";
import ContestProblems from "./pages/ContestProblems";
import ContestSolveProblem from "./pages/ContestSolveProblem";
import ContestResults from "./pages/ContestResults";
import Leaderboard from "./pages/Leaderboard";
import CreatePost from "./pages/Blogs/CreatePost";
import MyBlogs from "./pages/Blogs/MyBlogs";
import Blogs from "./pages/Blogs/Blogs";
import BlogDetail from "./pages/Blogs/BlogDetail";
import EditBlog from "./pages/Blogs/EditBlog";
import Playground from "./pages/Playground";
import Coach from "./pages/Coach";

export default function App() {
  return (
    <AuthProvider>
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/problemset/:problemId" element={<SolveProblem />} />
        <Route path="/problemset" element={<ProblemSet />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/my-lists" element={<MyList />} />
        <Route path="/contests" element={<Contests />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/problemset/:problemId/discussions/:discussionId" element={<DiscussionDetail />} />
        <Route path="/contests/:contestId/problems" element={<ContestProblems />} />
        <Route path="/contests/:contestId/solve/:problemId" element={<ContestSolveProblem />} />
        <Route path="/contests/:contestId" element={<ContestResults />} />
        <Route path="/playground" element={<Playground />} />
        <Route path="/performance/mine" element={<Coach />} />
        
        {/* Blog routes */}
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/mine" element={<MyBlogs />} />
        <Route path="/blogs/new" element={<CreatePost />} />
        <Route path="/blogs/:slug" element={<BlogDetail />} />
        <Route path="/blogs/:slug/edit" element={<EditBlog />} />

      </Routes>
    </AuthProvider>
  );
}
