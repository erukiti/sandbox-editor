import React from 'react';
import styled from 'styled-components';

// import Sandbox from './Sandbox';
import Editor from './editor/editor';
import { useTextEditorDetail } from './editor/TextEditor';

const AppDiv = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0px;
  padding: 0px;
`;

const App: React.FC = () => {
  // return <Todo />
  return (
    <AppDiv>
      <Editor useEditorDetail={useTextEditorDetail} />
    </AppDiv>
  );
};

export default App;
