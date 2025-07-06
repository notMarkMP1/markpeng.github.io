'use client';
import React, { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber';
import WaterShader from '@/app/components/WaterShader';
import FadeInSection from '@/app/components/FadeInSection';
import Image from 'next/image';

export default function Home() {
  const [devicePixelRatio, setDevicePixelRatio] = useState(2);
  const [hideUI, setHideUI] = useState(false);
  const [depth, setDepth] = useState(1.3);
  const [pressure, setPressure] = useState(0.999);
  const [isMobile, setIsMobile] = useState(false);
  const [shaderLoaded, setShaderLoaded] = useState(false);

  useEffect(() => {
    setDevicePixelRatio(window.devicePixelRatio);
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(window.navigator.userAgent));
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return (
    <>
    {!isMobile && (
      <Canvas 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100vh',
          zIndex: -1, // Place behind other content
          pointerEvents: 'auto', // Allow interaction with the canvas
          opacity: shaderLoaded ? 1 : 0.5,
          transition: 'opacity 0.2s ease-in-out'
        }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
        dpr={devicePixelRatio}
      >
        <WaterShader 
          depth={depth}
          pressure={pressure}
          hideUI={hideUI}
          onLoadedChange={setShaderLoaded}
        />
      </Canvas>
    )}
    <div className="flex flex-col items-center min-h-[calc(100vh-12rem)] justify-center space-y-2 py-4">
      {!hideUI ? (
        <>
          <FadeInSection>
            <h1 className="text-6xl text-center font-bold select-none">hello, i&apos;m Mark Peng!</h1>
          </FadeInSection>
          <FadeInSection delay={0.2}>
            <p className="text-lg text-center mx-4 select-none">
                An aspiring software engineer and current student at the University of Toronto studying computer science.
            </p>
          </FadeInSection>
          <div className="flex flex-row items-center justify-center space-x-4">
          <FadeInSection delay={0.5}>
            <a className="select-none bg-zinc-900 text-white rounded-lg hover:bg-[#222222] transition-colors flex items-center justify-center w-12 h-12" href="resume.pdf" target="_blank" rel="noopener noreferrer">
            <Image src="/file.svg" alt="resume" width={28} height={28}/>
            </a>
          </FadeInSection>
          <FadeInSection delay={0.6}>
            <a className="select-none bg-zinc-900 text-white rounded-lg hover:bg-[#222222] transition-colors flex items-center justify-center w-12 h-12" href="https://linkedin.com/in/markminpeng" target="_blank" rel="noopener noreferrer">
            <Image src="/linkedin.svg" alt="LinkedIn" width={28} height={28}/>
            </a>
          </FadeInSection>
          <FadeInSection delay={0.7}>
            <a className="select-none bg-zinc-900 text-white rounded-lg hover:bg-[#222222] transition-colors flex items-center justify-center w-12 h-12" href="https://github.com/notMarkMP1" target="_blank" rel="noopener noreferrer">
            <Image src="/github.svg" alt="GitHub" width={28} height={28}/>
            </a>
          </FadeInSection>
          </div>
          {!isMobile && (
            <>
              <FadeInSection delay={0.8}>
                <button
                  className="mt-4 px-6 py-2 bg-zinc-900 text-white select-none rounded-lg shadow-lg border border-zinc-700 hover:bg-[#222222] hover:scale-105 active:scale-95 transition-all duration-150 font-semibold tracking-wide text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setHideUI(true)}
                >
                  play with the shader
                </button>
              </FadeInSection>
              <FadeInSection delay={0.9}>
                <span className="text-xs italic text-zinc-400 select-none" style={{ fontStyle: 'italic' }}>
                  you can click to toggle the shader
                </span>
              </FadeInSection>
            </>
          )}
        </>
      ) : (
        <div className="w-full flex flex-col items-center justify-end min-h-[calc(100vh-14rem)] overflow-hidden">
          <div className="w-full max-w-xl flex flex-row items-end justify-between gap-8 mb-6 p-4 bg-zinc-900/80 rounded-xl shadow-lg border border-zinc-800">
            {/* Depth Slider */}
            <div className="flex flex-col items-center flex-1">
              <label htmlFor="depth-slider" className="text-sm select-none font-medium text-cyan-200 mb-1">Depth</label>
              <input
                id="depth-slider"
                type="range"
                min={0.1}
                max={1.4}
                step={0.01}
                className="w-full accent-cyan-400 bg-zinc-800 rounded-lg h-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={depth}
                onChange={e => setDepth(Number(e.target.value))}
              />
              <span className="text-xs text-cyan-300 select-none mt-1">{depth.toFixed(2)}</span>
            </div>
            {/* Pressure Slider */}
            <div className="flex flex-col items-center flex-1">
              <label htmlFor="pressure-slider" className="text-sm font-medium select-none  text-fuchsia-200 mb-1">Pressure</label>
              <input
                id="pressure-slider"
                type="range"
                min={0.7}
                max={0.999}
                step={0.0001}
                className="w-full accent-fuchsia-400 bg-zinc-800 rounded-lg h-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                value={pressure}
                onChange={e => setPressure(Number(e.target.value))}
              />
              <span className="text-xs text-fuchsia-300 select-none mt-1">{pressure.toFixed(3)}</span>
            </div>
          </div>
          <button
            className="px-6 py-2 bg-zinc-900 text-white rounded-lg shadow-lg border border-zinc-700 hover:bg-[#222222] hover:scale-105 active:scale-95 transition-all duration-150 font-semibold tracking-wide text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => setHideUI(false)}
          >
            Go Back
          </button>
        </div>
      )}
    </div>
    </> 
  )
}
