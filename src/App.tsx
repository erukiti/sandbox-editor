import React, { useState, useEffect } from "react";

import { runJSTest } from "./sandbox/javascript";

const initialSources: { [p: string]: string } = {
  "index.test.js": `const { answer } = require('index.js')

describe('computed on The Earth', () => {
  test('Life, the Universe, and Everything is 42.', () => {
    expect(answer()).toBe(42)
  })
})
`,
  "index.js": `function answer() {
  return 8 * 6;
}

module.exports = {
  answer
}
`
};

const App: React.FC = () => {
  const [stdout, setStdout] = useState("");

  useEffect(() => {
    runJSTest(initialSources, "index.test.js", setStdout);
  }, []);

  return (
    <code>
      <pre>{stdout}</pre>
    </code>
  );
};

export default App;
