import { useEffect, useState } from 'react'
import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import YouTubeChannelProcessor from './pages/YouTubeChannelProcessor.jsx';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    return () => {
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="w-full h-screen flex items-center justify-center flex-col gap-6">
        <div className="flex flex-col items-center">
          <h1
            style={{
              fontFamily: "Cairo, sans-serif",
            }}
            className="text-red-500 text-xl font-medium"
          >
            You are currently offline
          </h1>
          <p
            style={{
              fontFamily: "Cairo, sans-serif",
            }}
            className="text-gray-500"
          >
            Please check your connection and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <main
        className={`flex flex-col items-center justify-center min-h-screen`}
      >
        <Routes>
          <Route
            index
            element={<YouTubeChannelProcessor/>}
          />
          <Route
            index
            element={<YouTubeChannelProcessor/>}
          /> 
          <Route
            index
            element={<YouTubeChannelProcessor/>}
          />
          <Route
            index
            element={<YouTubeChannelProcessor/>}
          />
          <Route
            index
            element={<YouTubeChannelProcessor/>}
          />
          <Route
            index
            element={<YouTubeChannelProcessor/>}
          />

          <Route
            index
            element={<YouTubeChannelProcessor/>}
          /><Route
            index
            element={<YouTubeChannelProcessor/>}
          />


          
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
