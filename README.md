import React, { useState } from 'react';
import QRCodeGenerator from './components/QRCodeGenerator';
import UserDetails from './components/UserDetails';
import Papa from 'papaparse';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [userData, setUserData] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [sending, setSending] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');


  const handleGenerate = async () => {
    setQrCode('');
    setUserData(null);

    try {
      // Get session and access token from backend
      const sessionRes = await fetch('http://localhost:3000/create-session', { method: 'POST' });
      const sessionData = await sessionRes.json();

      if (!sessionData.sessionId || !sessionData.accessToken) {
        return alert('Failed to create session');
      }

      setSessionId(sessionData.sessionId);
      setAccessToken(sessionData.accessToken);

      const qrRes = await fetch(`http://localhost:3000/generate-qrcode/${sessionData.sessionId}`);
      const qrData = await qrRes.json();

      if (qrData.qrCode) {
        setQrCode(qrData.qrCode);

        const interval = setInterval(async () => {
          const userRes = await fetch(`http://localhost:3000/user-details/${sessionData.sessionId}`);
          if (userRes.ok) {
            const user = await userRes.json();
            setUserData(user);
            clearInterval(interval);
          }
        }, 3000);
      } else {
        alert('Failed to generate QR code');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  };

  const handleSendMessage = async () => {
    if (!sessionId || !phoneNumber || !message) {
      return alert('Session ID, phone number, and message are required!');
    }

    try {
      const res = await fetch('http://localhost:3000/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, phoneNumber, message }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Message sent successfully!');
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending message');
    }
  };

  const handleCsvChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleBulkSend = async () => {
    if (!sessionId || !csvFile || !accessToken || !bulkMessage.trim()) {
      return alert('Session ID, CSV file, access token, and message are required!');
    }
  
    setSending(true);
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
  
        for (const row of rows) {
          const number = row.number?.trim();
          if (!number) continue;
  
          try {
            const url = new URL('http://localhost:3000/api/send');
            url.searchParams.append('number', number);
            url.searchParams.append('message', bulkMessage.trim());
            url.searchParams.append('instance_id', sessionId);
            url.searchParams.append('access_token', accessToken);
            url.searchParams.append('type', 'text');
  
            await fetch(url);
          } catch (error) {
            console.error(`Failed to send to ${number}`, error);
          }
        }
  
        setSending(false);
        alert('Bulk messages sent!');
      },
    });
  };
  

  return (
    <div style={{ padding: 20 }}>
      <h1>WhatsApp QR Code Login</h1>
      <button onClick={handleGenerate}>Generate QR</button>
      {sessionId && <p><strong>Session ID:</strong> {sessionId}</p>}
      {qrCode && <QRCodeGenerator qrCode={qrCode} />}
      {userData && <UserDetails user={userData} />}
      {accessToken && (
        <p><strong>Access Token:</strong> {accessToken}</p>
      )}

      <div style={{ marginTop: 20 }}>
        <h3>Send WhatsApp Message</h3>
        <input
          type="text"
          placeholder="Phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <br />
        <textarea
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          cols={30}
        />
        <br />
        <button onClick={handleSendMessage}>Send Message</button>
      </div>

      <div style={{ marginTop: 40 }}>
  <h3>📤 Bulk Message Sender (via CSV)</h3>
  <input
    type="file"
    accept=".csv"
    onChange={handleCsvChange}
  />
  <br />
  <textarea
    placeholder="Enter the message to send to all contacts"
    value={bulkMessage}
    onChange={(e) => setBulkMessage(e.target.value)}
    rows={4}
    cols={40}
    style={{ marginTop: 10 }}
  />
  <br />
  <button onClick={handleBulkSend} disabled={sending || !bulkMessage}>
    {sending ? 'Sending...' : 'Send Bulk Messages'}
  </button>
</div>


      {userData && (
        <div style={{ marginTop: 20 }}>
          <h3>🔑 Your Public API Access</h3>
          <p><strong>Instance ID:</strong> {sessionId}</p>
          <p><strong>Access Token:</strong> {accessToken}</p>
          <code style={{ backgroundColor: '#f0f0f0', padding: '10px', display: 'block' }}>
            http://localhost:3000/api/send?number=919876543210&type=text&message=Hello&instance_id={sessionId}&access_token={accessToken}
          </code>
        </div>
      )}
    </div>
  );
}

export default App;










































const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Session = require('./models/Session');

const app = express();
app.use(cors());
app.use(express.json());

// Store sessions dynamically
const clients = {};
const qrCodes = {};
const userDetails = {};
const authorizedTokens = {}; // sessionId: accessToken

//Connect mongodb
 

mongoose.connect('mongodb+srv://thepawanpal:K3L1tfxu3G06xM5R@cluster0.rqldviu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(() => {
  console.log('✅ Connected to MongoDB');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err); 
});

// Test Server
app.get('/', (req, res) => {
    res.send("Server is Running");
});

// Create session and generate access token
app.post('/create-session', async (req, res) => {
    const sessionId = uuidv4();
    const accessToken = crypto.randomBytes(16).toString('hex');
  
    try {
      const session = new Session({ sessionId, accessToken });
      await session.save();
  
      res.json({ sessionId, accessToken });
    } catch (err) {
      console.error('Error saving session:', err);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });

// API to generate QR code
app.get('/generate-qrcode/:sessionId', async (req, res) => {
    const { sessionId } = req.params;

    if (clients[sessionId]) {
        console.log(`⚠️ Client for ${sessionId} is already initialized.`);
        return res.status(400).json({ error: 'Client already initialized' });
    }

    console.log(`🚀 Initializing client for ${sessionId}`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    clients[sessionId] = client;

    client.on('qr', (qr) => {
        console.log(`✅ QR Code generated for ${sessionId}`);
        qrCodes[sessionId] = qr;
    });

    client.on('authenticated', () => {
        console.log(`🔐 Authenticated for ${sessionId}`);
    });

    client.on('ready', async () => {
        console.log(`🚀 WhatsApp Web is ready for ${sessionId}`);
        
        if (client.info && client.info.wid) {
          const phoneNumber = client.info.wid.user;
          const name = client.info.pushname || 'Unknown';
          const serialized = client.info.wid._serialized;
      
          userDetails[sessionId] = { phoneNumber, name, serialized };
          console.log(`📞 Logged in as: ${name} (${phoneNumber}) - Serialized: ${serialized}`);
      
          try {
            // Update user details in the database
            await Session.findOneAndUpdate(
              { sessionId },
              { number: phoneNumber, name, serializedId: serialized },
              { new: true }
            );
            console.log('✅ Session user details updated in MongoDB');
          } catch (dbErr) {
            console.error('❌ MongoDB update error:', dbErr.message);
          }
      
          // Optionally notify another service
          try {
            const apiUrl = 'http://localhost:59397/api/Whatsapp/RegisterUser';
            await axios.post(apiUrl, { phoneNumber, name, serialized });
            console.log('✅ User registered successfully!');
          } catch (error) {
            console.error('❌ Error registering user externally:', error.response ? error.response.data : error.message);
          }
        }
      });

    client.on('disconnected', () => {
        console.log(`⚡ Client disconnected for ${sessionId}`);
        delete clients[sessionId];
        delete userDetails[sessionId];
        delete authorizedTokens[sessionId];
    });

    client.initialize();

    // Poll for QR Code generation
    let attempts = 0;
    const interval = setInterval(async () => {
        attempts++;
        if (qrCodes[sessionId]) {
            clearInterval(interval);
            try {
                const qrImage = await qrcode.toDataURL(qrCodes[sessionId]);
                return res.json({ qrCode: qrImage });
            } catch (error) {
                return res.status(500).json({ error: 'Failed to generate QR Code' });
            }
        }
        if (attempts > 20) {
            clearInterval(interval);
            return res.status(500).json({ error: 'QR Code generation timeout!' });
        }
    }, 1000);
});

// API to fetch user details
app.get('/user-details/:sessionId', (req, res) => {
    const { sessionId } = req.params;

    if (userDetails[sessionId]) {
        return res.json(userDetails[sessionId]);
    } else {
        return res.status(404).json({ error: 'User details not found' });
    }
});

// Send message (internal use)
app.post('/send-message', async (req, res) => {
    const { sessionId, phoneNumber, message } = req.body;

    const client = clients[sessionId];
    if (!client) {
        return res.status(400).json({ error: 'Invalid or expired session' });
    }

    try {
        const chatId = `${phoneNumber}@c.us`;
        await client.sendMessage(chatId, message);
        console.log(`📤 Message sent to ${phoneNumber}: ${message}`);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error sending message:', error.message);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Public API (like ziper.io style)
app.get('/api/send', async (req, res) => {
    const { number, type, message, instance_id, access_token } = req.query;

    if (!number || !message || !instance_id || !access_token) {
        return res.status(400).json({ status: 'error', message: 'Missing required parameters' });
    }

    // if (!authorizedTokens[instance_id] || authorizedTokens[instance_id] !== access_token) {
    //     return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    // }

    const client = clients[instance_id];
    if (!client) {
        return res.status(404).json({ status: 'error', message: 'Instance not found or not ready' });
    }

    try {
        const chatId = `${number}@c.us`;

        if (type === 'text') {
            await client.sendMessage(chatId, message);
        } else {
            return res.status(400).json({ status: 'error', message: 'Unsupported message type' });
        }

        return res.json({
            status: 'success',
            number,
            instance_id,
            type,
            message
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 'error', message: 'Failed to send message' });
    }
});

// Start server
app.listen(3000, () => {
    console.log('🚀 Server running at http://localhost:3000');
});
#   w h a t s a p p w e b _ f r o n t e n d  
 