import React from "react";

import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";

const App: React.FC = () => {
  const editorDiv = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<monaco.editor.IStandaloneCodeEditor>();

  React.useLayoutEffect(() => {
    editorRef.current = monaco.editor.create(editorDiv.current!, {
      automaticLayout: true,
      value: "const hoge = 1\n",
      language: "javascript"
    });
    editorRef.current.focus();
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = undefined;
      }
    };
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div ref={editorDiv} style={{ height: "100%" }} />
    </div>
  );
};

export default App;
