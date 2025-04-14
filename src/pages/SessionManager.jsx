import React, { useEffect, useState } from 'react';
import QRCodeGenerator from '../components/QRCodeGenerator';
import UserDetails from '../components/UserDetails';

export default function SessionManager({
  sessionId,
  setSessionId,
  accessToken,
  setAccessToken,
  userData,
  setUserData,
  qrCode,
  setQrCode,
}) {
  const [loading, setLoading] = useState(false);
  const [waitingForScan, setWaitingForScan] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | active | inactive

  // 🧠 Load from localStorage on first mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    const storedAccessToken = localStorage.getItem('accessToken');

    if (storedSessionId && storedAccessToken) {
      setSessionId(storedSessionId);
      setAccessToken(storedAccessToken);
    }
  }, []);

  // 💾 Save to localStorage whenever sessionId or accessToken changes
  useEffect(() => {
    if (sessionId) localStorage.setItem('sessionId', sessionId);
    if (accessToken) localStorage.setItem('accessToken', accessToken);
  }, [sessionId, accessToken]);

  // 🔄 Poll user status
  const checkUserConnection = async () => {
    if (!sessionId) return;
  
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/user-details/${sessionId}`);
  
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const user = await res.json();
          setUserData(user);
          setStatus('active');
        } else {
          console.warn('Expected JSON, but got:', contentType);
          const text = await res.text();
          console.warn('Response content:', text);
          setUserData(null);
          setStatus('inactive');
        }
      } else {
        const errText = await res.text(); // helpful for logging errors
        console.warn(`Server responded with ${res.status}: ${errText}`);
        setUserData(null);
        setStatus('inactive');
      }
    } catch (err) {
      console.error('Status check error:', err);
      setStatus('inactive');
    }
  };
  

  useEffect(() => {
    if (sessionId) {
      checkUserConnection(); // first check immediately
      const interval = setInterval(checkUserConnection, 5000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  const handleGenerate = async () => {
    setLoading(true);
    setQrCode('');
    setUserData(null);
    setStatus('idle');

    try {
      const sessionRes = await fetch(`${import.meta.env.VITE_API_URL}/create-session`, { method: 'POST' });
      const sessionData = await sessionRes.json();

      console.log(sessionData); 

      if (!sessionData.sessionId || !sessionData.accessToken) {
        setLoading(false);
        return alert('Failed to create session');
      }

      setSessionId(sessionData.sessionId);
      setAccessToken(sessionData.accessToken);

      const qrRes = await fetch(`${import.meta.env.VITE_API_URL}/generate-qrcode/${sessionData.sessionId}`);
      const qrData = await qrRes.json();

      if (qrData.qrCode) {
        setQrCode(qrData.qrCode);
        setWaitingForScan(true);

        const interval = setInterval(async () => {
          const userRes = await fetch(`${import.meta.env.VITE_API_URL}/user-details/${sessionData.sessionId}`);
          if (userRes.ok) {
            const user = await userRes.json();
            setUserData(user);
            setWaitingForScan(false);
            setStatus('active');
            clearInterval(interval);
          }
        }, 3000);
      } else {
        alert('Failed to generate QR code');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">WhatsApp QR Code Login</h1>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`px-4 py-2 rounded text-white ${
          loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {loading ? 'Generating...' : 'Generate QR'}
      </button>

      {sessionId && (
        <div>
          <p><strong>Session ID:</strong> {sessionId}</p>
          <p>
            <strong>Status:</strong>{' '}
            <span
              className={`font-medium ${
                status === 'active'
                  ? 'text-green-600'
                  : status === 'inactive'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {status === 'active' ? '🟢 Active' : status === 'inactive' ? '🔴 Inactive' : '🕓 Waiting'}
            </span>
          </p>
        </div>
      )}

      {qrCode && (
        <>
          <QRCodeGenerator qrCode={qrCode} />
          {waitingForScan && <p className="text-yellow-600">Waiting for you to scan and connect...</p>}
        </>
      )}

      {userData && <UserDetails user={userData} />}

      {accessToken && (
        <p>
          <strong>Access Token:</strong> {accessToken}
        </p>
      )}
    </div>
  );
}
