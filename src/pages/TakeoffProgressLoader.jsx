import React from 'react';

const TakeoffProgressLoader = () => {
  const brandColor = '#d4a445';

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-8 bg-white rounded-xl shadow-sm">
      
      {/* Loading Text */}
      <div className="mb-10 text-center animate-pulse">
        <h3 
          className="text-xl font-bold tracking-widest uppercase" 
          style={{ color: brandColor }}
        >
          Preparing for Takeoff
        </h3>
        <p className="text-sm mt-2 text-slate-500 font-medium">
          Retrieving the best routes and prices...
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full max-w-lg h-12 flex items-center">
        
        {/* Background Track (The Runway) */}
        <div className="absolute left-0 w-full h-1 bg-slate-100 rounded-full"></div>

        {/* Animated Fill Track (The Progress) */}
        <div 
          className="absolute left-0 h-1.5 rounded-full overflow-hidden shadow-sm"
          style={{ 
            backgroundColor: brandColor,
            animation: 'fillProgress 3.5s ease-in-out infinite' 
          }}
        ></div>

        {/* Animated Airplane */}
        <div 
          className="absolute z-10 -ml-6"
          style={{ animation: 'flyProgress 3.5s ease-in-out infinite' }}
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="#000000" 
                className="w-12 h-12 rotate-90"
            >
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5L21 16z" />
            </svg>
        </div>
        
        {/* Destination Marker */}
        <div 
          className="absolute right-0 w-3 h-3 rounded-full shadow-sm" 
          style={{ backgroundColor: brandColor }}
        ></div>
      </div>
      
      {/* Required Custom CSS for the Keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fillProgress {
          0% { width: 0%; opacity: 0; }
          10% { opacity: 1; }
          85% { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        @keyframes flyProgress {
          0% { left: 0%; opacity: 0; transform: translateY(0px) scale(0.9); }
          10% { opacity: 1; transform: translateY(0px) scale(1); }
          45% { transform: translateY(-6px) scale(1.05); } /* Slight "lift" in the middle of the flight */
          75% { transform: translateY(0px) scale(1); }
          85% { left: 100%; opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default TakeoffProgressLoader;