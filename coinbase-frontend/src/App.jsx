import React, { useRef } from 'react'
import Dashboard from './pages/Dashboard'
import LandingPage from './components/LandingPage'

function App() {
  const dashboardRef = useRef(null);

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <LandingPage onGetStarted={scrollToDashboard} />
      <div ref={dashboardRef}>
        <Dashboard />
      </div>
    </div>
  )
}

export default App
