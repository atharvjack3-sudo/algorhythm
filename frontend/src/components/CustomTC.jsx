import React, { useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Terminal, Plus, Trash2, PlaySquare } from "lucide-react";

function CustomTC({ setRunLoading, lang, code }) {
  const [testCases, setTestCases] = useState([""]);
  const [customRunRes, setCustomRunRes] = useState([]);
  const { user, loading: authLoading } = useAuth();

  const handleAddTestCase = () => {
    if (testCases.length < 3) {
      setTestCases([...testCases, ""]);
      setCustomRunRes([]);
    }
  };

  const handleRemoveTestCase = (indexToRemove) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, index) => index !== indexToRemove));
      setCustomRunRes([]);
    }
  };

  const handleTestCaseChange = (text, index) => {
    const updatedTestCases = [...testCases];
    updatedTestCases[index] = text;
    setTestCases(updatedTestCases);
    setCustomRunRes([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRunLoading(true);
    setCustomRunRes([]);
    try {
      const res = await api.post("/custom-run", {
        language: lang,
        code: code,
        testcases: testCases,
      });
      const obj = res.data;
      setCustomRunRes(obj.results);
    } catch (err) {
      console.error(err);
    } finally {
      setRunLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Test Case Input Section */}
      <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] flex items-center justify-between">
          <div className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-700 dark:text-slate-300 uppercase flex items-center gap-2">
            <Terminal size={14} className="text-orange-500" />
            Custom Test Cases
          </div>
          <span className="font-mono text-[10px] font-bold bg-white dark:bg-[#050608] border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-[3px] tracking-widest">
            {testCases.length} / 3
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          <div className="flex flex-col gap-5">
            {testCases.map((tc, index) => (
              <div key={index} className="flex flex-col gap-2 relative group">
                <div className="flex justify-between items-center">
                  <label className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                    Test Case {index + 1}
                  </label>
                  {testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTestCase(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                      title="Remove Test Case"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <textarea
                  value={tc}
                  onChange={(e) => handleTestCaseChange(e.target.value, index)}
                  placeholder={`Enter input for test case ${index + 1}...`}
                  className="w-full min-h-[100px] bg-slate-50 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 rounded-[3px] p-3 text-[13px] font-mono text-slate-800 dark:text-slate-300 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600 custom-scrollbar resize-y shadow-inner"
                  spellCheck="false"
                  required
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-slate-800/60 mt-2">
            <button
              type="button"
              onClick={handleAddTestCase}
              disabled={testCases.length >= 3}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 font-sans text-[12px] font-semibold tracking-wide rounded-[3px] transition-colors cursor-pointer"
            >
              <Plus size={14} /> Add Test Case
            </button>

            <button
              type="submit"
              disabled={authLoading || !user}
              className="flex items-center gap-1.5 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-sans text-[12px] font-semibold tracking-wide rounded-[3px] transition-colors shadow-sm cursor-pointer border border-orange-600"
            >
              <PlaySquare size={14} /> Run Custom
            </button>
          </div>
          
          {!authLoading && !user && (
            <div className="font-mono text-[10px] font-bold text-red-500 uppercase tracking-widest text-right mt-1">
              SIGN IN TO RUN CUSTOM TESTCASES
            </div>
          )}
        </form>
      </div>

      {/* Execution Results Section */}
      {customRunRes && customRunRes.length > 0 && (
        <div className="flex flex-col gap-5">
          {customRunRes.map((res, index) => {
            const isSuccess = res.verdict === "AC";
            const displayVerdict = isSuccess ? "Compiled" : res.verdict;

            return (
              <div key={index} className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col">
                <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#161b22]">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-700 dark:text-slate-300 uppercase">
                      Test Case {index + 1}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-[3px] border font-sans text-[10px] font-semibold tracking-wide ${
                        isSuccess ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-200 dark:border-orange-500/30"
                        : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/30"
                      }`}>
                      {displayVerdict}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                    {res.time !== undefined ? `${res.time} ms` : "- ms"}
                    <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                    {res.memory !== undefined ? `${res.memory} KB` : "- KB"}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                  <div className="flex flex-col">
                    <div className="px-4 py-2 bg-slate-50 dark:bg-[#0a0c10] border-b border-slate-100 dark:border-slate-800/50 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                      Input
                    </div>
                    <pre className="p-4 m-0 font-mono text-[13px] text-slate-800 dark:text-slate-300 whitespace-pre-wrap flex-1 bg-white dark:bg-[#0d1117]">
                      {testCases[index] || ""}
                    </pre>
                  </div>
                  <div className="flex flex-col">
                    <div className="px-4 py-2 bg-slate-50 dark:bg-[#0a0c10] border-b border-slate-100 dark:border-slate-800/50 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                      Output
                    </div>
                    <pre className="p-4 m-0 font-mono text-[13px] text-slate-800 dark:text-slate-300 whitespace-pre-wrap flex-1 bg-white dark:bg-[#0d1117]">
                      {res.output || <span className="italic text-slate-400 dark:text-slate-600">No output</span>}
                    </pre>
                  </div>
                </div>

                {res.error && (
                  <div className="border-t border-slate-200 dark:border-slate-800">
                    <div className="px-4 py-2 bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/20 font-mono text-[9px] font-bold text-red-600 dark:text-red-500 uppercase tracking-[0.1em]">
                      Stderr
                    </div>
                    <pre className="p-4 m-0 font-mono text-[12px] text-red-600 dark:text-red-400 whitespace-pre-wrap bg-white dark:bg-[#050608] max-h-48 overflow-y-auto">
                      {res.error}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomTC;