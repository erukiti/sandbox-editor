import React, { useRef, useState } from 'react';
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

import { useEditorActions, EditorDetail } from './editor';

const languagesByExtension: { [props: string]: string } = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  md: 'markdown'
};

const getLanguage = (filename: string) => {
  const ext = filename.split('.').pop() || '';
  return languagesByExtension[ext] || 'text';
};

export const useMonacoEditorDetail: EditorDetail = state => {
  const { setText, filename } = useEditorActions(state);
  const [
    editor,
    setEditor
  ] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const editorDiv = useRef<HTMLDivElement>(null);
  const modelsRef = useRef<{ [name: string]: monaco.editor.ITextModel }>(
    {}
  );
  const editorStatesRef = useRef<{
    [name: string]: monaco.editor.ICodeEditorViewState;
  }>({});

  console.log('Monaco Editor Detail', editor, editorDiv);

  React.useLayoutEffect(() => {
    console.log('useLayoutEffect', editorDiv.current);
    if (editor || !editorDiv.current) {
      return;
    }

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
    console.log('useLayoutEffect done');
    return () => {
      console.log('useLayoutEffect disposed');
      _editor.dispose();
    };
  }, [editor]);

  const { files } = state;

  React.useEffect(() => {
    if (files.length === 0 || !editor) {
      return;
    }
    console.log('create models');

    files.forEach(({ filename, text }) => {
      if (filename in modelsRef.current) {
        const model = modelsRef.current[filename];

        // FIXME? EditorModel が書き換わる事例がありうるか？
        // 全部Dispatchers 経由に出来たら、考える必要はない
        // が、安全的プログラミングで言えば入れて損はない？
        if (text !== model.getValue()) {
          model.pushEditOperations(
            [],
            [{ range: model.getFullModelRange(), text }],
            () => null
          );
          const viewState = editor.saveViewState()!;
          console.log('viewState', viewState);
          editorStatesRef.current[filename] = viewState;
          // あと、ここに、dispatcherが必要
        }
      } else {
        const model = monaco.editor.createModel(
          text,
          getLanguage(filename)
        );
        model.updateOptions({ tabSize: 2 });

        // FIXME: Disposable
        model.onDidChangeContent(ev => {
          const viewState = editor.saveViewState()!;
          console.log('viewState', viewState);
          editorStatesRef.current[filename] = viewState;
          setText(editor.getValue());
        });

        modelsRef.current[filename] = model;
      }
    });
  }, [editor, files, setText]);

  React.useEffect(() => {
    if (files.length === 0 || !editor) {
      return;
    }

    console.log('setModel', filename);
    if (editor.getModel() !== modelsRef.current[filename]) {
      editor.setModel(modelsRef.current[filename]);
      editor.restoreViewState(editorStatesRef.current[filename]);
    }
    editor.focus();
  }, [editor, files, filename]);

  return () => (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div ref={editorDiv} style={{ height: '100%' }} />
    </div>
  );
};

//   editorRef.current!.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
//     editorRef.current!.getAction('editor.action.formatDocument').run()
//     run('index.test.js')
//   })
// }, [run])
