import { useState } from "react";

import VoiceRecorder from "./components/Dashboard";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
    <VoiceRecorder/>
    </>
  );
}

export default App;
