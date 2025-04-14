import React, { useState } from 'react';
import SessionManager from './SessionManager';
import SendMessageForm from './SendMessageForm';
import BulkMessageForm from './BulkMessageForm';
import PublicApiInfo from './PublicApiInfo';

function Home() {
  const [sessionId, setSessionId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [userData, setUserData] = useState(null);
  const [accessToken, setAccessToken] = useState('');

  return (
    <div style={{ padding: 20 }}>
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

      <SendMessageForm sessionId={sessionId} />

      <BulkMessageForm sessionId={sessionId} accessToken={accessToken} />

      <PublicApiInfo userData={userData} sessionId={sessionId} accessToken={accessToken} />
    </div>
  );
}

export default Home;
