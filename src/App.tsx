import React from 'react';
import styled from 'styled-components';

import Sandbox from './sandbox';

const AppDiv = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0px;
  padding: 0px;
`;

const App: React.FC = () => {
  return (
    <AppDiv>
      <Sandbox />
    </AppDiv>
  );
};

export default App;
