import React, { useState } from 'react';

export default function SendMessageForm({ sessionId }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!sessionId || !phoneNumber || !message) {
      return alert('Session ID, phone number, and message are required!');
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, phoneNumber, message }),
      });

      const data = await res.json();
      res.ok ? alert('Message sent successfully!') : alert(data.error || 'Failed to send message');
    } catch (err) {
      console.error(err);
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-xl p-6 space-y-4 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800">📤 Send WhatsApp Message</h2>

      <input
        type="text"
        placeholder="Phone number (with country code)"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <textarea
        placeholder="Type your message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <button
        onClick={handleSendMessage}
        disabled={loading}
        className={`w-full py-2 rounded-lg text-white font-medium ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 transition'
        }`}
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  );
}
