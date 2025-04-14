import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
 
import { useState } from 'react';
import SessionManager from './pages/SessionManager';
import SendMessageForm from './pages/SendMessageForm';
import BulkMessageForm from './pages/BulkMessageForm';
import PublicApiInfo from './pages/PublicApiInfo';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [userData, setUserData] = useState(null);
  const [accessToken, setAccessToken] = useState('');

  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar />

        <div className="flex-1 p-4 overflow-auto">
          <Routes>
            <Route
              path="/"
              element={
                <SessionManager
                  sessionId={sessionId}
                  setSessionId={setSessionId}
                  accessToken={accessToken}
                  setAccessToken={setAccessToken}
                  userData={userData}
                  setUserData={setUserData}
                  qrCode={qrCode}
                  setQrCode={setQrCode}
                />
              }
            />
            <Route path="/send" element={<SendMessageForm sessionId={sessionId} />} />
            <Route path="/bulk" element={<BulkMessageForm sessionId={sessionId} accessToken={accessToken} />} />
            <Route path="/api-info" element={<PublicApiInfo userData={userData} sessionId={sessionId} accessToken={accessToken} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
