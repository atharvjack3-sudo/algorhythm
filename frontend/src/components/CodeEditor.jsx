import Editor from "@monaco-editor/react";

export default function CodeEditor({ code, setCode }) {
  return (
    <div className="flex-1 bg-gray-900">
      <Editor
        height="100%"
        defaultLanguage="cpp"
        value={code}
        onChange={(value) => setCode(value ?? "")}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: "JetBrains Mono, monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: "on",
          tabSize: 2,
        }}
      />
    </div>
  );
}
