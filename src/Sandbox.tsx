import React from "react";
import styled from "styled-components";

import { useSandbox } from "./SandboxHooks";

const initialSources: { [p: string]: string } = {
  "index.test.js": `const { truth } = require('index.js')

describe('truth', () => {
  test('All number is 42', () => {
    expect(truth()).toBe(42)
  })
})
`,
  "index.js": `function truth() {
  return 8 * 6;
}

module.exports = {
  truth
}
`
};

const EditorDiv = styled.div`
  width: 50vw;
  height: 100vh;
`;

const SandboxDiv = styled.div`
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 50% 50%;
`;

const Sandbox: React.FC = () => {
  const {
    run,
    stdout,
    editorDiv,
    sources,
    selectFilename,
    newFile,
    filename
  } = useSandbox(initialSources);
  const [newFilename, setNewFilename] = React.useState("");

  const sourceList = Object.keys(sources).map(name => ({
    name,
    size: sources[name].length
  }));

  console.log("sources", sources);
  return (
    <SandboxDiv>
      <EditorDiv style={{ gridColumn: "1/2" }} ref={editorDiv} />
      <div style={{ gridColumn: "2/2" }}>
        <button onClick={() => run()}>RUN</button>
        <form
          onSubmit={ev => {
            ev.preventDefault();
            newFile(newFilename);
            setNewFilename("");
          }}
        >
          <input
            type="text"
            value={newFilename}
            onChange={e => setNewFilename(e.target.value)}
          />
          <button type="submit">create new file</button>
        </form>
        <div>
          {sourceList.map(({ name, size }: any) => {
            const isCurrent = name === filename;
            const style = isCurrent ? { background: "#aacccc" } : {};
            return (
              <div
                onClick={() => selectFilename(name)}
                key={name}
                style={style}
              >
                {name}: {size} bytes
              </div>
            );
          })}
        </div>
        <code>
          <pre>{stdout}</pre>
        </code>
      </div>
    </SandboxDiv>
  );
};

export default Sandbox;
