import React from 'react';

const UserDetails = ({ user }) => {
  return (
    <div style={{ marginTop: 20 }}>
      <h3>Authenticated User:</h3>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Phone:</strong> {user.phoneNumber}</p>
      <p><strong>Serialized ID:</strong> {user.serialized}</p>
    </div>
  );
};

export default UserDetails;
