// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import ModelPage from "./pages/ModelPage";
import LandingPage from "./pages/LandingPage"; // <<--- IMPORT YOUR LANDING PAGE
import { GoogleMapsApiProvider } from "./contexts/GoogleMapsApiContext";
// Optional: Import a Layout component if you have one
// import Layout from './components/Layout';

function App() {
  return (
    <GoogleMapsApiProvider>
      {/* If you have a common Layout (Navbar, Footer), wrap Routes with it: */}
      {/* <Layout> */}
      <div className="app-content">
        {" "}
        {/* Or remove if Layout handles this */}
        <Routes>
          <Route path="/model" element={<ModelPage />} />
          <Route path="/" element={<LandingPage />} />{" "}
          {/* <<--- RENDER LANDING PAGE HERE */}
          {/* You can add a 404 Not Found route as well */}
          {/* <Route path="*" element={<NotFoundPage />} /> */}
        </Routes>
      </div>
      {/* </Layout> */}
    </GoogleMapsApiProvider>
  );
}

export default App;
