import React from 'react';

export default function PublicApiInfo({ userData, sessionId, accessToken }) {
  if (!userData) return null;

  const apiUrl = `${import.meta.env.VITE_API_URL}/api/send`;
  const payload = {
    number: '919876543210',
    type: 'text',
    message: 'Hello',
    instance_id: sessionId,
    access_token: accessToken,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    alert('📋 Payload copied to clipboard!');
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white shadow-lg rounded-xl space-y-4">
      <h2 className="text-xl font-semibold">🔑 Your Public API Access</h2>

      <div>
        <p><strong>Endpoint (POST):</strong></p>
        <code className="block bg-gray-100 p-2 rounded text-sm">
          {apiUrl}
        </code>
      </div>

      <div>
        <p><strong>Example JSON Payload:</strong></p>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>

      <button
        onClick={handleCopy}
        className="bg-green-600 hover:bg-green-700  text-white px-4 py-2 rounded-lg transition"
      >
        Copy JSON Payload
      </button>
    </div>
  );
}
