import React, { useState, useEffect, useCallback } from 'react';

export interface EditorFile {
  filename: string;
  text: string;
}

const untitled: EditorFile = {
  filename: 'untitled.md',
  text: ''
};

export interface EditorState {
  files: EditorFile[];
  setFiles: (act: React.SetStateAction<EditorFile[]>) => void;
  currentTab: number;
  setCurrentTab: (act: React.SetStateAction<number>) => void;
}

export const useEditorActions = (state: EditorState) => {
  const { files, setFiles, currentTab, setCurrentTab } = state;
  const { filename, text } =
    files.length === 0 ? untitled : files[currentTab];

  const setText = useCallback(
    (newText: string, tab = currentTab) => {
      console.log('setText', newText);
      setFiles(arr =>
        arr.map((file, index) => {
          return index !== tab
            ? file
            : { filename: file.filename, text: newText };
        })
      );
    },
    [currentTab, setFiles]
  );

  const setFilename = useCallback(
    (newFilename: string, tab = currentTab) => {
      console.log('setFilename', newFilename);
      setFiles(arr =>
        arr.map((file, index) => {
          return index !== tab
            ? file
            : { filename: newFilename, text: file.text };
        })
      );
    },
    [currentTab, setFiles]
  );

  const newFile = useCallback(
    (newFilename: string, newText: string) => {
      console.log('newFile', newFilename, newText);
      setFiles(arr => [...arr, { filename: newFilename, text: newText }]);
    },
    [setFiles]
  );

  return {
    files,
    filename,
    text,
    currentTab,
    setCurrentTab,
    setText,
    setFilename,
    newFile
  };
};

export type EditorDetail = (state: EditorState) => React.FC;

interface EditorProps {
  useEditorDetail: EditorDetail;
  handleFiles?: (files: EditorFile[]) => void;
  handleTab?: (tab: number) => void;
}

const Editor: React.FC<EditorProps> = ({
  useEditorDetail,
  handleFiles,
  handleTab
}) => {
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [currentTab, setCurrentTab] = useState(0);
  const state: EditorState = {
    files,
    setFiles,
    currentTab,
    setCurrentTab
  };
  console.log('Editor function');
  const { newFile } = useEditorActions(state);
  const renderer = useEditorDetail(state);

  useEffect(() => {
    if (handleFiles) {
      console.log('handleFiles');
      handleFiles(files);
    }
  }, [handleFiles, files]);

  useEffect(() => {
    if (handleTab) {
      console.log('handleTab');
      handleTab(currentTab);
    }
  }, [handleTab, currentTab]);

  console.log('files.length', files.length);
  if (files.length <= 0) {
    return renderer({});
  } else {
    return (
      <div>
        <div>NOT OPENED</div>
        <button onClick={() => newFile('sample.txt', 'sample...')}>
          create
        </button>
      </div>
    );
  }
};

export default Editor;
