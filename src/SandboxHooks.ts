import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution.js';

import 'monaco-editor/esm/vs/editor/browser/controller/coreCommands.js';
import 'monaco-editor/esm/vs/editor/browser/widget/codeEditorWidget.js';
import 'monaco-editor/esm/vs/editor/contrib/bracketMatching/bracketMatching.js';
import 'monaco-editor/esm/vs/editor/contrib/caretOperations/caretOperations.js';
import 'monaco-editor/esm/vs/editor/contrib/caretOperations/transpose.js';
import 'monaco-editor/esm/vs/editor/contrib/clipboard/clipboard.js';
import 'monaco-editor/esm/vs/editor/contrib/codelens/codelensController.js';
import 'monaco-editor/esm/vs/editor/contrib/comment/comment.js';
import 'monaco-editor/esm/vs/editor/contrib/contextmenu/contextmenu.js';
import 'monaco-editor/esm/vs/editor/contrib/cursorUndo/cursorUndo.js';
import 'monaco-editor/esm/vs/editor/contrib/find/findController.js';
import 'monaco-editor/esm/vs/editor/contrib/folding/folding.js';
import 'monaco-editor/esm/vs/editor/contrib/parameterHints/parameterHints.js';
import 'monaco-editor/esm/vs/editor/contrib/smartSelect/smartSelect.js';
import 'monaco-editor/esm/vs/editor/contrib/suggest/suggestController.js';
import 'monaco-editor/esm/vs/editor/contrib/wordHighlighter/wordHighlighter.js';
import 'monaco-editor/esm/vs/editor/contrib/wordOperations/wordOperations.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js';
import 'monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js';

import { runJSTest } from './sandbox/javascript';

export type SandboxFiles = { [filename: string]: string };

const useSandboxFiles = () => {
  const [files, setFiles] = useState<SandboxFiles>({});
  return { files, setFiles };
};

monaco.languages.registerDocumentFormattingEditProvider('javascript', {
  async provideDocumentFormattingEdits(model) {
    const prettier = await import('prettier/standalone');
    const babylon = await import('prettier/parser-babylon');
    const text = prettier.format(model.getValue(), {
      parser: 'babel',
      plugins: [babylon],
      singleQuote: true,
      tabWidth: 2
    });
    console.log('format');

    return [
      {
        range: model.getFullModelRange(),
        text
      }
    ];
  }
});

const languageByExtensions: { [props: string]: string } = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  md: 'markdown'
};

const getLanguage = (filename: string) => {
  const ext = filename.split('.').pop() || '';
  console.log(ext);
  return languageByExtensions[ext] || 'text';
};

export const useSandbox = (initialSources: { [p: string]: string }) => {
  console.log('useSandbox');

  const editorDiv = useRef<HTMLDivElement>(null);
  const [
    editor,
    setEditor
  ] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const { files, setFiles } = useSandboxFiles();

  const [filename, setFilename] = React.useState('index.test.js');
  const [stdout, setStdout] = React.useState('');
  const subscriptionRef = useRef<monaco.IDisposable[]>([]);
  const modelsRef = useRef<{ [name: string]: monaco.editor.ITextModel }>(
    {}
  );
  const editorStatesRef = useRef<{
    [name: string]: monaco.editor.ICodeEditorViewState;
  }>({});

  const run = React.useCallback(
    (name: string = 'index.test.js') => {
      console.log('run');
      setStdout('');
      runJSTest(files, name, setStdout);
    },
    [files, setStdout]
  );

  const unsubscription = () => {
    subscriptionRef.current.forEach(subscription => {
      subscription.dispose();
    });
    subscriptionRef.current = [];
  };

  useLayoutEffect(() => {
    console.log('useLayoutEffect', editorDiv.current);
    const height =
      editorDiv.current!.parentElement!.clientHeight -
      editorDiv.current!.offsetTop;
    editorDiv.current!.style.height = `${height}px`;

    const _editor = monaco.editor.create(editorDiv.current!, {
      minimap: {
        enabled: false
      },
      fontSize: 16,
      lineNumbers: 'on',
      wordWrap: 'on',
      automaticLayout: true
    });
    _editor.focus();
    setEditor(_editor);
    console.log(1);
    return () => {
      console.log('useLayoutEffect disposed');
      _editor.dispose();
      unsubscription();
    };
  }, []);

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor!.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
      editor.getAction('editor.action.formatDocument').run();
      run('index.test.js');
    });
  }, [run, editor]);

  useEffect(() => {
    console.log('create models');
    const newSources: { [name: string]: string } = {};
    Object.keys(initialSources).forEach(name => {
      const text = initialSources[name];
      if (name in modelsRef.current) {
        const model = modelsRef.current[name];
        if (text !== model.getValue()) {
          model.pushEditOperations(
            [],
            [{ range: model.getFullModelRange(), text }],
            () => null
          );
        }
      } else {
        const model = monaco.editor.createModel(text, getLanguage(name));
        model.updateOptions({
          tabSize: 2
        });
        modelsRef.current[name] = model;
      }
      newSources[name] = modelsRef.current[name].getValue();
    });
    setFiles(newSources);
  }, [initialSources, setFiles]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    console.log('setModel', filename);
    editor.setModel(modelsRef.current[filename]);
    editor.restoreViewState(editorStatesRef.current[filename]);
    editor.focus();
  }, [editor, filename]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    console.log('subscription', filename);
    subscriptionRef.current.push(
      modelsRef.current[filename].onDidChangeContent(ev => {
        editorStatesRef.current[filename] = editor.saveViewState()!;
        setFiles(x => ({
          ...x,
          [filename]: modelsRef.current[filename].getValue()
        }));
        // onChange
      })
    );
    return () => {
      unsubscription();
    };
  }, [editor, filename, setFiles]);

  const selectFilename = React.useCallback(
    (s: string) => {
      if (editor) {
        editorStatesRef.current[filename] = editor.saveViewState()!;
      }
      setFilename(s);
    },
    [filename]
  );

  const newFile = React.useCallback(
    (s: string) => {
      const model = monaco.editor.createModel('', getLanguage(s));
      model.updateOptions({
        tabSize: 2
      });
      modelsRef.current[s] = model;
      setFiles(x => {
        x[s] = x[s] || '';
        return x;
      });
      selectFilename(s);
    },
    [selectFilename, setFiles]
  );

  const sources = files;
  return {
    run,
    stdout,
    editorDiv,
    sources,
    selectFilename,
    newFile,
    filename
  };
};
