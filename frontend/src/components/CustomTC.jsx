import React, { useState } from "react";
import { api } from "../api/client";

function CustomTC({ setRunLoading, lang, code }) {
  const [testCases, setTestCases] = useState([""]);
  const [customRunRes, setCustomRunRes] = useState([]);

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
      console.log(err);
    } finally {
      setRunLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-700/50 p-4 shadow-lg flex flex-col gap-4 text-slate-800 dark:text-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-3">
        <h3 className="text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-200 uppercase">
          Add Custom Test Cases
        </h3>
        <span className="text-xs text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800 px-2 py-1 rounded-xs font-bold tracking-widest">
          {testCases.length} / 3
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Test Cases List */}
        <div className="flex flex-col gap-4">
          {testCases.map((tc, index) => (
            <div key={index} className="flex flex-col gap-2 relative group">
              <div className="flex justify-between items-center">
                <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Test Case {index + 1}
                </label>
                {testCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTestCase(index)}
                    className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Remove Test Case"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                )}
              </div>
              <textarea
                value={tc}
                onChange={(e) => handleTestCaseChange(e.target.value, index)}
                placeholder={`Enter custom test case ${index + 1} here...`}
                className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-sm p-3 text-xs font-semibold tracking-wide font-mono text-slate-800 dark:text-slate-300 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 resize-y transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                spellCheck="false"
                required
              />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-200 dark:border-slate-700/50">
          <button
            type="button"
            onClick={handleAddTestCase}
            disabled={testCases.length >= 3}
            className="flex cursor-pointer tracking-wide text-xs rounded-xs items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 font-semibold transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            Add Test Case
          </button>

          <button
            type="submit"
            className="px-6 py-2 text-xs bg-orange-500 hover:bg-orange-600 dark:hover:bg-orange-400 text-white font-semibold tracking-wide rounded-xs cursor-pointer transition-colors shadow-sm"
          >
            Run Custom
          </button>
        </div>
      </form>

      {/* Execution Results Section */}
      {customRunRes && customRunRes.length > 0 && (
        <div className="flex flex-col gap-4 mt-2 pt-4 border-t border-slate-200 dark:border-slate-700/50">
          <h3 className="text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-200 uppercase">
            Execution Results
          </h3>
          <div className="flex flex-col gap-4">
            {customRunRes.map((res, index) => {
              const isSuccess = res.verdict === "AC";
              const displayVerdict = isSuccess ? "Compiled Successfully" : res.verdict;
              const inputForThisRun = testCases[index] || "";

              return (
                <div
                  key={index}
                  className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-sm border border-slate-200 dark:border-slate-700"
                >
                  {/* Result Header & Stats */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Test Case {index + 1}
                      </span>
                      <span
                        className={`text-xs font-bold tracking-wide px-2 py-1 rounded-sm ${
                          isSuccess
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {displayVerdict}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
                      <span>⏱ {res.time} ms</span>
                      <span>💾 {res.memory} KB</span>
                    </div>
                  </div>

                  {/* Input Block */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                      Input
                    </span>
                    <div className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-2 rounded-sm font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words min-h-[40px]">
                      {inputForThisRun}
                    </div>
                  </div>

                  {/* Output Block */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                      Output
                    </span>
                    <div className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-2 rounded-sm font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words min-h-[40px]">
                      {res.output || <span className="text-slate-400 italic">No output</span>}
                    </div>
                  </div>

                  {/* Error Block (if any) */}
                  {res.error && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[11px] font-semibold tracking-wider text-red-500 uppercase">
                        Error / stderr
                      </span>
                      <div className="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-2 rounded-sm font-mono text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                        {res.error}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomTC;