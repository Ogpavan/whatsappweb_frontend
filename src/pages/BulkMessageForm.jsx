import React, { useState } from 'react';
import Papa from 'papaparse';

export default function BulkMessageForm({ sessionId, accessToken }) {
  const [csvFile, setCsvFile] = useState(null);
  const [bulkMessage, setBulkMessage] = useState('');
  const [sending, setSending] = useState(false);

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
      complete: async ({ data }) => {
        for (const row of data) {
          const number = row.number?.trim();
          if (!number) continue;

          try {
            const url = new URL(`${import.meta.env.VITE_BASE_URL}/api/send`);
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
        alert('✅ Bulk messages sent!');
        setCsvFile(null);
        setBulkMessage('');
      },
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-8 space-y-6">
      <h2 className="text-2xl font-semibold">📤 Bulk Message Sender</h2>

      <input
        type="file"
        accept=".csv"
        onChange={handleCsvChange}
        className="w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer"
      />

      <textarea
        placeholder="Enter message to send to all contacts"
        value={bulkMessage}
        onChange={(e) => setBulkMessage(e.target.value)}
        rows={4}
        className="w-full p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <button
        onClick={handleBulkSend}
        disabled={sending || !bulkMessage}
        className={`w-full py-2 rounded-lg text-white font-semibold ${
          sending
            ? 'bg-gray-500 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 transition'
        }`}
      >
        {sending ? 'Sending...' : 'Send Bulk Messages'}
      </button>
    </div>
  );
}
