import { BrowserRouter, Route, Routes } from "react-router-dom";
import Landing from "./pages";
import NotFoundPage from "./pages/not-found";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
