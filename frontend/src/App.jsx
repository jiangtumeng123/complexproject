import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';
import AppRouter from './router/router';

function App() {
  return (
   <div className='App'>
    <AppRouter />
   </div>
  );
}

export default App;
