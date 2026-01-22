import React from "react";
import { Code, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Landing() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white">
      {/* HERO / FEATURES / STATS / LISTS / GAMIFICATION / DISCUSSION */}
      {/* (UNCHANGED — trimmed here for brevity in explanation) */}
      {/* Hero Section */}{" "}
      <section className="pt-20 pb-20 px-6">
        {" "}
        <div className="max-w-7xl mx-auto">
          {" "}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {" "}
            <div>
              {" "}
              <div className="inline-block px-4 py-2 bg-cyan-50 text-cyan-600 rounded-full text-sm font-medium mb-6">
                {" "}
                Level up your coding skills{" "}
              </div>{" "}
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {" "}
                Master algorithms through{" "}
                <span className="text-cyan-500"> practice</span>{" "}
              </h1>{" "}
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {" "}
                Join thousands of developers solving problems, competing in
                contests, and preparing for technical interviews on Algorhythm.{" "}
              </p>{" "}
              <div className="flex flex-col sm:flex-row gap-4">
                {" "}
                <button onClick={() => {
                  if (!user) navigate("/auth");
                  else navigate("/problemset");
                 // console.log(user);
                   
                }} className="px-8 py-4 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition flex items-center justify-center space-x-2">
                  {" "}
                  <span>Start Coding Now</span>{" "}
                  <ArrowRight className="w-5 h-5" />{" "}
                </button>{" "}
                <button className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-cyan-500 hover:text-cyan-500 transition">
                  {" "}
                  Explore Problems{" "}
                </button>{" "}
              </div>{" "}
              <div className="mt-12 grid grid-cols-2 gap-6">
                {" "}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4">
                  {" "}
                  <div className="text-2xl font-bold text-gray-900">
                    Top Tier
                  </div>{" "}
                  <div className="text-sm text-gray-600">Coding Problems</div>{" "}
                </div>{" "}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4">
                  {" "}
                  <div className="text-2xl font-bold text-gray-900">
                    Weekly
                  </div>{" "}
                  <div className="text-sm text-gray-600">Live Contests</div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="relative">
              {" "}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 shadow-xl">
                {" "}
                {/* Code Editor Preview */}{" "}
                <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg mb-4">
                  {" "}
                  <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2 border-b border-gray-700">
                    {" "}
                    <div className="flex space-x-2">
                      {" "}
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>{" "}
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>{" "}
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>{" "}
                    </div>{" "}
                    <span className="text-xs text-gray-400 ml-4">
                      two_sum.cpp
                    </span>{" "}
                  </div>{" "}
                  <div className="p-4 text-sm font-mono">
                    {" "}
                    <div className="text-purple-400">
                      vector<span className="text-gray-400">&lt;</span>
                      <span className="text-cyan-400">int</span>
                      <span className="text-gray-400">&gt;</span>{" "}
                      <span className="text-blue-300">twoSum</span>
                      <span className="text-yellow-400">(</span>vector
                      <span className="text-gray-400">&lt;</span>
                      <span className="text-cyan-400">int</span>
                      <span className="text-gray-400">&gt;&</span> nums
                      <span className="text-yellow-400">)</span>{" "}
                      <span className="text-yellow-400">{"{"}</span>
                    </div>{" "}
                    <div className="text-gray-400 ml-4">
                      {" "}
                      <span className="text-purple-400">unordered_map</span>
                      <span className="text-gray-400">&lt;</span>
                      <span className="text-cyan-400">int</span>,{" "}
                      <span className="text-cyan-400">int</span>
                      <span className="text-gray-400">&gt;</span> seen;
                    </div>{" "}
                    <div className="text-gray-400 ml-4">
                      {" "}
                      <span className="text-purple-400">for</span>{" "}
                      <span className="text-yellow-400">(</span>
                      <span className="text-cyan-400">int</span> i ={" "}
                      <span className="text-green-400">0</span>; ...
                    </div>{" "}
                    <div className="text-gray-400 ml-8">
                      {" "}
                      <span className="text-purple-400">if</span>{" "}
                      <span className="text-yellow-400">(</span>seen.count
                      <span className="text-yellow-400">(</span>target
                      <span className="text-yellow-400">))</span>
                    </div>{" "}
                    <div className="text-gray-400 ml-12">
                      {" "}
                      <span className="text-purple-400">return</span>{" "}
                      <span className="text-yellow-400">{"{"}</span>
                      seen[target], i
                      <span className="text-yellow-400">{"}"}</span>;
                    </div>{" "}
                    <div className="text-gray-400 ml-4">
                      {" "}
                      <span className="text-yellow-400">{"}"}</span>
                    </div>{" "}
                    <div className="text-yellow-400">{"}"}</div>{" "}
                  </div>{" "}
                </div>{" "}
                {/* Contest Card */}{" "}
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  {" "}
                  <div className="flex items-center justify-between mb-3">
                    {" "}
                    <div className="flex items-center space-x-3">
                      {" "}
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                        {" "}
                        <Trophy className="w-5 h-5 text-white" />{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <div className="font-bold text-gray-900">
                          Algorhythm Weekly 2
                        </div>{" "}
                        <div className="text-xs text-gray-500">
                          Starts soon!
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between text-sm">
                    {" "}
                    <div className="text-gray-600">4 Problems</div>{" "}
                    <div className="px-3 py-1 bg-cyan-50 text-cyan-600 rounded-full text-xs font-medium">
                      Register Now
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-cyan-200 rounded-full opacity-50 blur-2xl"></div>{" "}
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-200 rounded-full opacity-50 blur-2xl"></div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      {/* Features Section */}{" "}
      <section className="py-20 px-6 bg-gray-50">
        {" "}
        <div className="max-w-7xl mx-auto">
          {" "}
          <div className="text-center mb-16">
            {" "}
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Algorhythm?
            </h2>{" "}
            <p className="text-xl text-gray-600">
              Everything you need to excel in coding interviews and competitions
            </p>{" "}
          </div>{" "}
          <div className="grid md:grid-cols-3 gap-8">
            {" "}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition">
              {" "}
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-6">
                {" "}
                <Code className="w-6 h-6 text-cyan-500" />{" "}
              </div>{" "}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Curated Problems
              </h3>{" "}
              <p className="text-gray-600 leading-relaxed">
                {" "}
                Access 500+ carefully selected problems covering all major data
                structures and algorithms, from beginner to expert level.{" "}
              </p>{" "}
            </div>{" "}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition">
              {" "}
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-6">
                {" "}
                <Trophy className="w-6 h-6 text-cyan-500" />{" "}
              </div>{" "}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Weekly Contests
              </h3>{" "}
              <p className="text-gray-600 leading-relaxed">
                {" "}
                Compete with developers worldwide in timed contests. Climb the
                leaderboard and earn recognition for your skills.{" "}
              </p>{" "}
            </div>{" "}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition">
              {" "}
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-6">
                {" "}
                <TrendingUp className="w-6 h-6 text-cyan-500" />{" "}
              </div>{" "}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Track Progress
              </h3>{" "}
              <p className="text-gray-600 leading-relaxed">
                {" "}
                Visualize your improvement with detailed analytics, acceptance
                rates, and activity heatmaps to stay motivated.{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      {/* Stats Section */}{" "}
      <section className="py-20 px-6">
        {" "}
        <div className="max-w-7xl mx-auto">
          {" "}
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-12 text-white">
            {" "}
            <div className="grid md:grid-cols-4 gap-8 text-center">
              {" "}
              <div>
                {" "}
                <div className="text-4xl font-bold mb-2">10+</div>{" "}
                <div className="text-cyan-100">Coding Problems</div>{" "}
              </div>{" "}
              <div>
                {" "}
                <div className="text-4xl font-bold mb-2">5+</div>{" "}
                <div className="text-cyan-100">Active Users</div>{" "}
              </div>{" "}
              <div>
                {" "}
                <div className="text-4xl font-bold mb-2">10+</div>{" "}
                <div className="text-cyan-100">Contests Held</div>{" "}
              </div>{" "}
              <div>
                {" "}
                <div className="text-4xl font-bold mb-2">1K+</div>{" "}
                <div className="text-cyan-100">Solutions Submitted</div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      {/* Custom Lists Section */}{" "}
      <section className="py-20 px-6 bg-white overflow-hidden">
        {" "}
        <div className="max-w-7xl mx-auto">
          {" "}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {" "}
            {/* Artwork Left */}{" "}
            <div className="relative animate-fade-in-left">
              {" "}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 shadow-xl">
                {" "}
                {/* List Cards Stack */}{" "}
                <div className="space-y-4">
                  {" "}
                  {/* List Card 1 */}{" "}
                  <div className="bg-white rounded-xl border-l-4 border-cyan-500 p-5 shadow-sm hover:shadow-md transition">
                    {" "}
                    <div className="flex items-center justify-between mb-3">
                      {" "}
                      <h4 className="font-bold text-gray-900">
                        Interview Prep
                      </h4>{" "}
                      <span className="text-xs bg-cyan-100 text-cyan-600 px-2 py-1 rounded-full">
                        15 problems
                      </span>{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <div className="flex justify-between text-sm text-gray-600">
                        {" "}
                        <span>Progress</span>{" "}
                        <span className="font-semibold">8/15</span>{" "}
                      </div>{" "}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        {" "}
                        <div
                          className="h-full bg-cyan-500 rounded-full"
                          style={{ width: "53%" }}
                        ></div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  {/* List Card 2 */}{" "}
                  <div className="bg-white rounded-xl border-l-4 border-purple-500 p-5 shadow-sm hover:shadow-md transition">
                    {" "}
                    <div className="flex items-center justify-between mb-3">
                      {" "}
                      <h4 className="font-bold text-gray-900">
                        Dynamic Programming
                      </h4>{" "}
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                        20 problems
                      </span>{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <div className="flex justify-between text-sm text-gray-600">
                        {" "}
                        <span>Progress</span>{" "}
                        <span className="font-semibold">5/20</span>{" "}
                      </div>{" "}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        {" "}
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: "25%" }}
                        ></div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  {/* List Card 3 */}{" "}
                  <div className="bg-white rounded-xl border-l-4 border-green-500 p-5 shadow-sm hover:shadow-md transition">
                    {" "}
                    <div className="flex items-center justify-between mb-3">
                      {" "}
                      <h4 className="font-bold text-gray-900">
                        Arrays & Strings
                      </h4>{" "}
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                        12 problems
                      </span>{" "}
                    </div>{" "}
                    <div className="space-y-2">
                      {" "}
                      <div className="flex justify-between text-sm text-gray-600">
                        {" "}
                        <span>Progress</span>{" "}
                        <span className="font-semibold">12/12</span>{" "}
                      </div>{" "}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        {" "}
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: "100%" }}
                        ></div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-cyan-200 rounded-full opacity-50 blur-2xl"></div>{" "}
            </div>{" "}
            {/* Text Right */}{" "}
            <div className="animate-fade-in-right">
              {" "}
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {" "}
                Take Hold of Your{" "}
                <span className="text-cyan-500">Learning Journey</span>{" "}
              </h2>{" "}
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {" "}
                Create custom problem lists tailored to your goals. Whether
                you're preparing for interviews, mastering specific topics, or
                building a study routine - organize your practice your way.{" "}
              </p>{" "}
              <div className="space-y-4">
                {" "}
                <div className="flex items-start gap-3">
                  {" "}
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    {" "}
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      {" "}
                      <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />{" "}
                    </svg>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Explore Different Approaches
                    </h4>{" "}
                    <p className="text-gray-600">
                      Learn multiple ways to solve the same problem and optimize
                      your thinking
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="flex items-start gap-3">
                  {" "}
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    {" "}
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      {" "}
                      <path
                        fillRule="evenodd"
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                        clipRule="evenodd"
                      />{" "}
                    </svg>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Get Community Support
                    </h4>{" "}
                    <p className="text-gray-600">
                      Ask questions, get help when stuck, and grow together with
                      peers
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      {/* Problem Categories Section */}{" "}
      <section className="py-20 px-6 bg-gray-50 overflow-hidden">
        {" "}
        <div className="max-w-7xl mx-auto">
          {" "}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {" "}
            {/* Text Left */}{" "}
            <div className="animate-fade-in-left order-2 md:order-1">
              {" "}
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {" "}
                Curated Problem{" "}
                <span className="text-cyan-500">Collections</span>{" "}
              </h2>{" "}
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                {" "}
                Access carefully organized problem sets tailored for interview
                preparation and competitive programming excellence.{" "}
              </p>{" "}
              <div className="space-y-4">
                {" "}
                <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-cyan-500 hover:shadow-md transition">
                  {" "}
                  <div className="flex items-center gap-3 mb-2">
                    {" "}
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                      {" "}
                      <svg
                        className="w-5 h-5 text-cyan-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {" "}
                        <path
                          fillRule="evenodd"
                          d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />{" "}
                        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />{" "}
                      </svg>{" "}
                    </div>{" "}
                    <h4 className="font-bold text-gray-900">
                      Interview Prep Collection
                    </h4>{" "}
                  </div>{" "}
                  <p className="text-sm text-gray-600 mb-2">
                    Master problems frequently asked at FAANG and top tech
                    companies
                  </p>{" "}
                  <span className="text-xs text-cyan-600 font-semibold">
                    250+ Problems • Easy to Hard
                  </span>{" "}
                </div>{" "}
                <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-purple-500 hover:shadow-md transition">
                  {" "}
                  <div className="flex items-center gap-3 mb-2">
                    {" "}
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      {" "}
                      <svg
                        className="w-5 h-5 text-purple-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {" "}
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />{" "}
                      </svg>{" "}
                    </div>{" "}
                    <h4 className="font-bold text-gray-900">
                      Competitive Programming
                    </h4>{" "}
                  </div>{" "}
                  <p className="text-sm text-gray-600 mb-2">
                    Challenge yourself with algorithmic problems for contests
                    and olympiads
                  </p>{" "}
                  <span className="text-xs text-purple-600 font-semibold">
                    180+ Problems • Medium to Expert
                  </span>{" "}
                </div>{" "}
                <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500 hover:shadow-md transition">
                  {" "}
                  <div className="flex items-center gap-3 mb-2">
                    {" "}
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      {" "}
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {" "}
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />{" "}
                      </svg>{" "}
                    </div>{" "}
                    <h4 className="font-bold text-gray-900">
                      Topic-Wise Learning
                    </h4>{" "}
                  </div>{" "}
                  <p className="text-sm text-gray-600 mb-2">
                    Build strong foundations with problems organized by data
                    structures and algorithms
                  </p>{" "}
                  <span className="text-xs text-green-600 font-semibold">
                    300+ Problems • Beginner to Advanced
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Artwork Right */}{" "}
            <div className="relative animate-fade-in-right order-1 md:order-2">
              {" "}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 shadow-xl">
                {" "}
                {/* Stats Grid */}{" "}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {" "}
                  <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                    {" "}
                    <div className="text-3xl font-bold text-cyan-600 mb-1">
                      500+
                    </div>{" "}
                    <div className="text-sm text-gray-600">Total Problems</div>{" "}
                  </div>{" "}
                  <div className="bg-white rounded-xl p-5 shadow-sm text-center">
                    {" "}
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      25+
                    </div>{" "}
                    <div className="text-sm text-gray-600">Topics Covered</div>{" "}
                  </div>{" "}
                </div>{" "}
                {/* Topic Pills */}{" "}
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  {" "}
                  <h4 className="font-bold text-gray-900 mb-4">
                    Popular Topics
                  </h4>{" "}
                  <div className="flex flex-wrap gap-2">
                    {" "}
                    <span className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">
                      Arrays
                    </span>{" "}
                    <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      Dynamic Programming
                    </span>{" "}
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Trees
                    </span>{" "}
                    <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      Graphs
                    </span>{" "}
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Binary Search
                    </span>{" "}
                    <span className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                      Strings
                    </span>{" "}
                    <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      Hash Tables
                    </span>{" "}
                    <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                      Sorting
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
                {/* Difficulty Distribution */}{" "}
                <div className="bg-white rounded-xl p-5 shadow-sm mt-4">
                  {" "}
                  <h4 className="font-bold text-gray-900 mb-4">
                    Difficulty Distribution
                  </h4>{" "}
                  <div className="space-y-3">
                    {" "}
                    <div>
                      {" "}
                      <div className="flex justify-between text-sm mb-1">
                        {" "}
                        <span className="text-gray-600">Easy</span>{" "}
                        <span className="font-semibold text-green-600">
                          180 problems
                        </span>{" "}
                      </div>{" "}
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        {" "}
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: "36%" }}
                        ></div>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <div className="flex justify-between text-sm mb-1">
                        {" "}
                        <span className="text-gray-600">Medium</span>{" "}
                        <span className="font-semibold text-orange-600">
                          250 problems
                        </span>{" "}
                      </div>{" "}
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        {" "}
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: "50%" }}
                        ></div>{" "}
                      </div>{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <div className="flex justify-between text-sm mb-1">
                        {" "}
                        <span className="text-gray-600">Hard</span>{" "}
                        <span className="font-semibold text-red-600">
                          70 problems
                        </span>{" "}
                      </div>{" "}
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        {" "}
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: "14%" }}
                        ></div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-cyan-200 rounded-full opacity-50 blur-2xl"></div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>
      {/* Gamification Section */}
      <section className="py-20 px-6 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text Left */}
            <div className="animate-fade-in-left order-2 md:order-1">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Compete & Earn{" "}
                <span className="text-cyan-500">Recognition</span>
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                Turn your coding practice into an exciting journey. Earn badges
                for milestones, climb global leaderboards, and showcase your
                achievements to the world.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 text-amber-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Unlock Badges
                    </h4>
                    <p className="text-gray-600">
                      Earn exclusive badges for solving streaks, topic mastery,
                      and contest victories
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 text-amber-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Global Leaderboards
                    </h4>
                    <p className="text-gray-600">
                      See how you rank against coders worldwide and in your
                      region
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 text-amber-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Showcase Achievements
                    </h4>
                    <p className="text-gray-600">
                      Display your profile with stats, badges, and rankings to
                      potential employers
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Artwork Right */}
            <div className="relative animate-fade-in-right order-1 md:order-2">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 shadow-xl">
                {/* Badges Display */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-2">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      100 Solved
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mb-2">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      30 Day Streak
                    </span>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-2">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      Contest Win
                    </span>
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Global Leaderboard
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-amber-500">
                          1
                        </span>
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-amber-600">
                            A
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          Alex_2024
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">
                        2,450 pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">
                          2
                        </span>
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-600">
                            S
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          Sarah_Dev
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">
                        2,380 pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-cyan-50 -mx-2 px-2 py-2 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-cyan-600">
                          3
                        </span>
                        <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            Y
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900">You</span>
                      </div>
                      <span className="text-sm font-semibold text-cyan-600">
                        2,340 pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-amber-200 rounded-full opacity-50 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>
      {/* Discussion Section */}
      <section className="py-20 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Artwork Left */}
            <div className="relative animate-fade-in-left">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 shadow-xl">
                {/* Discussion Thread */}
                <div className="bg-white rounded-xl p-5 shadow-sm mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-purple-600">
                        J
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          John_Coder
                        </span>
                        <span className="text-xs text-gray-500">
                          2 hours ago
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        Here's a solution to Better Call Walter in O(E*V).
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button className="flex items-center gap-1 hover:text-cyan-500">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span>12 replies</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-cyan-500">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                            />
                          </svg>
                          <span>24 upvotes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reply */}
                <div className="bg-white rounded-xl p-5 shadow-sm ml-8">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-cyan-600">M</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          Maria_Tech
                        </span>
                        <span className="text-xs text-gray-500">
                          1 hour ago
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Solved
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        You can optimize it further using dijkstra to O(ElogV)! 
                        Here's how:
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button className="flex items-center gap-1 hover:text-cyan-500">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                            />
                          </svg>
                          <span>18 upvotes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-200 rounded-full opacity-50 blur-2xl"></div>
            </div>

            {/* Text Right */}
            <div className="animate-fade-in-right">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Learn Together Through{" "}
                <span className="text-cyan-500">Discussion</span>
              </h2>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Connect with a thriving community of developers. Share
                solutions, discuss approaches, and learn from different
                perspectives on every problem — from brute force ideas to highly
                optimized techniques.
              </p>

              <div className="space-y-6">
                {/* Item 1 */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 text-purple-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Share Your Solutions
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      Post your approach, explain your thought process, and help
                      others understand how you arrived at the solution.
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 text-cyan-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Get Feedback Instantly
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      Receive feedback on correctness, time complexity, and edge
                      cases from experienced developers and top performers.
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Learn Multiple Approaches
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      Discover alternative strategies such as greedy, dynamic
                      programming, and data-structure–based optimizations for
                      the same problem.
                    </p>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <svg
                      className="w-4 h-4 text-amber-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Build Reputation
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      Gain upvotes, earn recognition, and establish yourself as
                      a reliable contributor within the community.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>{" "}
      </section>
      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join Algorhythm today and transform your coding skills with
            structured practice and real-time feedback.
          </p>
          <button className="px-8 py-4 bg-cyan-500 text-white rounded-lg font-medium text-lg hover:bg-cyan-600 transition inline-flex items-center space-x-2">
            <span>Create Free Account</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
      {/* Animations */}
      {/* <style jsx>{`
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-left {
          animation: fadeInLeft 0.8s ease-out;
        }
        .animate-fade-in-right {
          animation: fadeInRight 0.8s ease-out;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-left,
          .animate-fade-in-right,
          .animate-fade-in-up {
            animation: none;
          }
        }
      `}</style> */}
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">A</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  Algorhythm
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                Master coding through practice and competition.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Platform</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  Problems
                </a>
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  Contests
                </a>
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  Leaderboard
                </a>
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  Discuss
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  Blogs
                </a>
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  Documentation
                </a>
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  API
                </a>
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  Support
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  About
                </a>
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  Careers
                </a>
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  Privacy
                </a>
                <a href="#" className="block text-gray-600 hover:text-cyan-500">
                  Terms
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 text-center text-sm text-gray-600">
            © 2026 Algorhythm. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
