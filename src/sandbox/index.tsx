import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { MonacoEditor } from './MonacoEditor';

import { runJSTest } from './javascript';

export type SandboxFiles = { [filename: string]: string };

const initialSources: { [p: string]: string } = {
  'index.test.js': `const { truth } = require('index.js')

describe('truth', () => {
  test('All number is 42', () => {
    expect(truth()).toBe(42)
  })
})
`,
  'index.js': `function truth() {
  return 8 * 6;
}

module.exports = {
  truth
}
`
};

const useSandboxFiles = () => {
  const [files, setFiles] = useState<SandboxFiles>(initialSources);
  const [filename, setFilename] = React.useState('index.test.js');

  const setText = useCallback(
    (newText: string, newFilename: string = filename) => {
      setFiles(x => ({
        ...x,
        [newFilename]: newText
      }));
    },
    [setFiles, filename]
  );

  const newFile = (newFilename: string) => {
    setText('', newFilename);
    setFilename(newFilename);
  };

  return { files, setText, newFile, filename, setFilename };
};

const SandboxDiv = styled.div`
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 50% 50%;
`;

type FileSelectorProps = {
  files: SandboxFiles;
  filename: string;
  setFilename: React.Dispatch<React.SetStateAction<string>>;
};

const FileSelector: React.FC<FileSelectorProps> = ({
  files,
  filename,
  setFilename
}) => {
  const fileList = useMemo(() => {
    return Object.keys(files).map(name => {
      return {
        name,
        size: files[name].length,
        isCurrent: name === filename
      };
    });
  }, [files, filename]);

  return (
    <div>
      {fileList.map(({ name, size, isCurrent }) => {
        if (isCurrent) {
          return (
            <div key={name} style={{ backgroundColor: '#acc' }}>
              {name}: {size}bytes
            </div>
          );
        } else {
          return (
            <div key={name} onClick={() => setFilename(name)}>
              {name}: {size}bytes
            </div>
          );
        }
      })}
    </div>
  );
};

type FileCreatorProps = {
  setFilename: React.Dispatch<React.SetStateAction<string>>;
  setText: (newText: string, newFilename?: string) => void;
};
const FileCreator: React.FC<FileCreatorProps> = ({
  setFilename,
  setText
}) => {
  const [newFilename, setNewFilename] = React.useState('');

  return (
    <form
      onSubmit={ev => {
        ev.preventDefault();
        setText('', newFilename);
        setFilename(newFilename);
      }}
    >
      <input
        type="text"
        value={newFilename}
        onChange={e => setNewFilename(e.target.value)}
      />
      <button type="submit">create new file</button>
    </form>
  );
};

const useSandboxRunner = (files: SandboxFiles) => {
  const [stdout, setStdout] = React.useState('');

  const run = React.useCallback(
    (name: string = 'index.test.js') => {
      console.log('run');
      setStdout('');
      runJSTest(files, name, setStdout);
    },
    [files, setStdout]
  );

  return { stdout, run };
};

const Sandbox: React.FC = () => {
  const { files, setText, filename, setFilename } = useSandboxFiles();
  const { run, stdout } = useSandboxRunner(files);

  return (
    <SandboxDiv>
      <div style={{ gridColumn: '1/2', height: '100%' }}>
        <MonacoEditor
          run={run}
          text={files[filename]}
          setText={setText}
          filename={filename}
        />
      </div>
      <div style={{ gridColumn: '2/2' }}>
        <FileCreator setFilename={setFilename} setText={setText} />
        <FileSelector
          files={files}
          filename={filename}
          setFilename={setFilename}
        />
        <button onClick={() => run()}>RUN</button>
        <code>
          <pre>{stdout}</pre>
        </code>
      </div>
    </SandboxDiv>
  );
};

export default Sandbox;
