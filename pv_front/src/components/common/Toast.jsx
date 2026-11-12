import React from 'react';

export default function Toast({ toastState }) {
  const { show, message, icon } = toastState;

  return (
    <div className={`toast ${show ? 'show' : ''}`}>
      <span>{icon || '✨'}</span>
      <span>{message}</span>
    </div>
  );
}
