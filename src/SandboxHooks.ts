import { useRef, useEffect, useLayoutEffect, useState } from 'react';

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

import { EditorProps } from './Sandbox';

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

type EditorState = {
  [filename: string]: {
    model: monaco.editor.ITextModel;
    editorViewState: monaco.editor.ICodeEditorViewState | null;
  };
};

export const useSandboxEditor = (state: EditorProps) => {
  console.log('useSandbox');
  const { setText, run, text, filename } = state;

  const editorDiv = useRef<HTMLDivElement>(null);
  const [
    editor,
    setEditor
  ] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const subscriptionRef = useRef<monaco.IDisposable[]>([]);
  const editorStateRef = useRef<EditorState>({});

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
    // セーブコマンドの登録
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
      editor.getAction('editor.action.formatDocument').run();
      run('index.test.js');
    });
  }, [run, editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    console.log('create model and EditorViewState');

    // text/filename を、エディタモデルに変換
    const newModel = () => {
      const model = monaco.editor.createModel(text, getLanguage(filename));
      model.updateOptions({ tabSize: 2 });
      editor.setModel(model);
      editor.focus();
      const editorViewState = editor.saveViewState();
      editorStateRef.current[filename] = { model, editorViewState };
    };

    const updateModel = () => {
      const { model, editorViewState } = editorStateRef.current[filename];
      if (text !== model.getValue()) {
        model.pushEditOperations(
          [],
          [{ range: model.getFullModelRange(), text }],
          () => null
        );
      }
      editor.setModel(model);
      editor.focus();

      if (editorViewState) {
        editor.restoreViewState(editorViewState);
      }
    };

    if (filename in editorStateRef.current) {
      updateModel();
    } else {
      newModel();
    }
  }, [editor, text, filename]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    console.log('create model subscription', filename);
    // 文字入力を、setTextに反映させるフック
    subscriptionRef.current.push(
      editorStateRef.current[filename].model.onDidChangeContent(ev => {
        editorStateRef.current[
          filename
        ].editorViewState = editor.saveViewState();
        setText(editorStateRef.current[filename].model.getValue());
        // onChange
      })
    );
    // cursor移動を、saveStateするフック
    subscriptionRef.current.push(
      editor.onDidChangeCursorPosition(ev => {
        editorStateRef.current[
          filename
        ].editorViewState = editor.saveViewState();
      })
    );

    return () => {
      unsubscription();
    };
  }, [editor, filename, setText]);

  return {
    editorDiv
  };
};
