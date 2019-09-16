import React from 'react';

import { useEditorActions, EditorState } from './editor';

export const useTextEditorDetail = (state: EditorState) => {
  console.log('texteditor details');
  const { filename, text, setText } = useEditorActions(state);

  return () => (
    <div>
      <div>filename: {filename}</div>
      <textarea onChange={ev => setText(ev.target.value)} value={text} />
    </div>
  );
};
