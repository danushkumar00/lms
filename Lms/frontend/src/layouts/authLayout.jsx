import React from 'react';
import { Outlet } from 'react-router-dom';
import AuroraShader from '../Components/lightswind/aurora-shader.js';

const SHADER_COLOR_STOPS = ['#FDE047', '#F59E0B', '#EA580C'];

// We memoize the whole layout because its props (the background) never change
const AuthLayout = React.memo(() => {
  return (
    // Hardened, GPU-isolated container
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-white isolate"> 
      
      {/* Absolute background layer - sits here forever while navigating */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none layout-bg"
        style={{ contain: 'strict', width: '100vw', height: '100vh'}}
      >
        <AuroraShader
          colorStops={SHADER_COLOR_STOPS}
          amplitude={1.0}
          blend={0.5}
          speed={1.0}
        />
      </div>
    
      {/* UI layer where SignIn and SignUp are rendered */}
      <div className="flex items-center justify-center min-h-screen w-full relative z-10">
        {/* React Router placeholder where the active page component appears */}
        <Outlet />
      </div>
    </div>
  );
});

export default AuthLayout;