import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavigationBar from "./components/NavigationBar";
import HomePage from "./pages/HomePage";
import ControlDashboard from "./pages/ControlDashboard";
import PredictDashboard from "./pages/PredictDashboard";
import CleanDataForm from "./pages/CleanDataForm";
import TrainModelForm from "./pages/TrainModelForm";
import CommunityPage from "./pages/Community";
import LiveDataCollection from "./pages/LiveDataCollection";

function App() {
  const [updatesEnabled, setUpdatesEnabled] = useState(true);

  return (
    <BrowserRouter>
      <NavigationBar />
      <Routes>
        <Route path="/" element={<HomePage />} /> {/* الصفحة الافتراضية */}
        <Route path="/control" element={
          <ControlDashboard
            updatesEnabled={updatesEnabled}
            setUpdatesEnabled={setUpdatesEnabled}
          />
        } />
        <Route path="/predict" element={<PredictDashboard updatesEnabled={updatesEnabled} />} />
        {/* <Route path="/compare-models" element={<CompareModels updatesEnabled={updatesEnabled} />} /> */} {/* احذف هذا السطر */}
        <Route path="/clean-data" element={<CleanDataForm />} />
        <Route path="/train-model" element={<TrainModelForm />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/collect-live-data" element={<LiveDataCollection />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
