import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "./components/Home";
import { GameView } from "./components/GameView";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:gameId" element={<GameView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
