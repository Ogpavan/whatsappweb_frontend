import React from 'react';

const QRCodeGenerator = ({ qrCode }) => {
  return (
    <div style={{ marginTop: 20 }}>
      <h3>Scan this QR Code:</h3>
      <img src={qrCode} alt="QR Code" width="300" />
    </div>
  );
};

export default QRCodeGenerator;
