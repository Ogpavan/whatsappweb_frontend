import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function BulkMessageForm({ sessionId, accessToken }) {
  const [inputFile, setInputFile] = useState(null);
  const [bulkMessage, setBulkMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [delaySeconds, setDelaySeconds] = useState(3); // Default 3 seconds delay
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = (e) => {
    setInputFile(e.target.files[0]);
    console.log('[📁 File Selected]', e.target.files[0].name);
  };

  const parseFile = (file, callback) => {
    const ext = file.name.split('.').pop().toLowerCase();
    console.log('[📊 Parsing File]', file.name);

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data }) => {
          console.log('[✅ CSV Parsed]', data);
          callback(data);
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        console.log('[✅ Excel Parsed]', data);
        callback(data);
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Unsupported file type! Please upload a .csv, .xlsx, or .xls file.');
    }
  };

  const replacePlaceholders = (template, data) => {
    return template.replace(/{(\w+)}/g, (_, key) => data[key]?.toString() || '');
  };

  // Sleep function to create a delay
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Function to send a single message
  const sendMessage = async (number, message) => {
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/bulksend`;
      
      const payload = {
        recipients: [
          {
            number,
            message
          }
        ],
      };
    
      const fullUrl = new URL(url);
      fullUrl.searchParams.append('instance_id', sessionId);
      fullUrl.searchParams.append('access_token', accessToken);
    
      const response = await fetch(fullUrl.href, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    
      const resText = await response.text();
    
      if (!response.ok) {
        throw new Error(resText || 'Unknown error');
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error sending message: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const handleBulkSend = () => {
    if (!sessionId || !inputFile || !accessToken || !bulkMessage.trim()) {
      return alert('Session ID, file, access token, and message are required!');
    }

    setSending(true);
 
    parseFile(inputFile, async (data) => {
      // Filter valid rows that have phone numbers
      const validRows = data.filter(row => row.number?.toString().trim());
      const totalMessages = validRows.length;
      
      setProgress({ current: 0, total: totalMessages });
      
      let successful = 0;
      let failed = [];

      // Process one message at a time with delays in between
      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const number = row.number.toString().trim();
        const personalizedMessage = replacePlaceholders(bulkMessage, row);
        
        // Update progress before sending
        setProgress({ current: i + 1, total: totalMessages });
        
        console.log(`[🚀 Sending message ${i + 1}/${totalMessages} to ${number}]`);
        
        // Send the message
        const result = await sendMessage(number, personalizedMessage);
        
        if (result.success) {
          console.log(`[✅ Sent to ${number}]`);
          successful++;
        } else {
          console.error(`[❌ Failed to send to ${number}]`, result.error);
          failed.push(number);
        }
        
        // Apply delay before the next message - but only if there are more messages to send
        if (i < validRows.length - 1) {
          console.log(`[⏱️ Waiting ${delaySeconds} seconds before sending next message...]`);
          await sleep(delaySeconds * 1000);
        }
      }

      // Reset states after completion
      setSending(false);
      setInputFile(null);
      setBulkMessage('');
      setProgress({ current: 0, total: 0 });

      // Show summary
      if (failed.length > 0) {
        alert(`✅ Successfully sent: ${successful}, ❌ Failed: ${failed.length}\nFailed numbers: ${failed.join(', ')}`);
      } else {
        alert(`✅ All messages sent successfully to ${successful} contacts!`);
      }

      console.log('[🏁 Bulk Send Complete]');
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-8 space-y-6">
      <h2 className="text-2xl font-semibold">📤 Bulk Message Sender</h2>

      <input
        type="file"
        accept=".csv, .xlsx, .xls"
        onChange={handleFileChange}
        className="w-full file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700 cursor-pointer"
      />

      <textarea
        placeholder="Enter message (e.g., Hello {name}, your address is {address})"
        value={bulkMessage}
        onChange={(e) => setBulkMessage(e.target.value)}
        rows={4}
        className="w-full p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <div className="flex items-center space-x-2">
        <label className="text-gray-700">Delay between messages:</label>
        <input
          type="number"
          min="1"
          max="60"
          value={delaySeconds}
          onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 3)}
          className="w-16 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <span className="text-gray-700">seconds</span>
      </div>

      <button
        onClick={handleBulkSend}
        disabled={sending || !bulkMessage}
        className={`w-full py-2 rounded-lg text-white font-semibold ${
          sending
            ? 'bg-gray-500 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 transition'
        }`}
      >
        {sending ? `Sending ${progress.current}/${progress.total}...` : 'Send Bulk Messages'}
      </button>

      {sending && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-sm text-center mt-1 text-gray-600">
            {progress.current} of {progress.total} messages sent 
            {progress.current < progress.total && ` (${delaySeconds}s delay between messages)`}
          </p>
        </div>
      )}
    </div>
  );
}