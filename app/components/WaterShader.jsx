'use client';
import React, { useRef, useState, useEffect, forwardRef } from 'react';
import { useThree, useFrame, createPortal } from '@react-three/fiber';
import { OrthographicCamera, useFBO } from '@react-three/drei';
import { 
    Scene, 
    ShaderMaterial, 
    Vector4, 
    Vector2, 
    Mesh, 
    PlaneGeometry,
    CanvasTexture,
    NearestFilter,
    RGBAFormat,
    FloatType
} from 'three';

import {
    simMaterialVertexShader,
    simMaterialFragmentShader,
    renderMaterialVertexShader,
    renderMaterialFragmentShader
} from '@/app/utils/shaders';


export default function WaterShader({ depth, pressure, hideUI }, ref) {
    // scene found on page.tsx
    /*
    SETUP
    */
    const { viewport, size, gl } = useThree();
    const [mouse, setMouse] = useState({ x: 0, y: 0, z: 0, w: 0 });
    const [toggleShader, setToggleShader] = useState(true); 
    const frameCount = useRef(0);
    const [dimensions, setDimensions] = useState([size.width, size.height]);
    const dimensionsRef = useRef(dimensions);
    useEffect(() => {
        dimensionsRef.current = dimensions;
    }, [dimensions]);
    
    // canvas drawing
    function createNameTexture(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        const displayText = width < 768 ? 'MP' : 'MARK';
        ctx.font = `bold ${width * 0.3}px "Helvetica Neue", Montserrat, "Arial Black", sans-serif`;
        ctx.fillStyle = '#0e0e0e';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, width / 2, height / 2);
        const texture = new CanvasTexture(canvas);
        texture.needsUpdate = true;
        return { canvas, texture };
    }
    
    // create canvas
    const canvasRef = useRef();
    const [nameTexture, setNameTexture] = useState(() => {
        const { canvas, texture } = createNameTexture(dimensions[0], dimensions[1]);
        canvasRef.current = canvas;
        return texture;
    });
    
    // ping-pong FBOs
    const fboA = useFBO(dimensions[0], dimensions[1], {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        type: FloatType,
        stencilBuffer: false,
        depthBuffer: false
    });
    const fboB = useFBO(dimensions[0], dimensions[1], {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        type: FloatType,
        stencilBuffer: false,
        depthBuffer: false
    });
    
    // simulated scene
    const [simScene] = useState(() => new Scene());
    const simCameraRef = useRef();
    const simMeshRef = useRef();
    
    // simulation material
    const [simMaterial] = useState(() => new ShaderMaterial({
        vertexShader: simMaterialVertexShader,
        fragmentShader: simMaterialFragmentShader,
        uniforms: {
            iFrame: { value: 0 },
            iMouse: { value: new Vector4(0, 0, 0, 0) },
            iResolution: { value: new Vector2(dimensions[0], dimensions[1]) },
            iChannel0: { value: null },
            delta: { value: depth },
            iPressure: { value: pressure },
        }
    }));
    
    // rendered material
    const [renderMaterial] = useState(() => new ShaderMaterial({
        vertexShader: renderMaterialVertexShader,
        fragmentShader: renderMaterialFragmentShader,
        uniforms: {
            iChannel0: { value: null },
            iChannel1: { value: nameTexture }
        },
        transparent: true
    }));
    
    // add sim mesh to simScene
    useEffect(() => {
        if (!simMeshRef.current) {
            const mesh = new Mesh(
                new PlaneGeometry(2, 2),
                simMaterial
            );
            simScene.add(mesh);
            simMeshRef.current = mesh;
        }
    }, [simScene, simMaterial]);
    

    /* 
    EVENTS
    */
    // handle window resize; redraw canvas and update FBOs
    useEffect(() => {
        const handleResize = () => {
            const newWidth = window.innerWidth * gl.getPixelRatio();
            const newHeight = window.innerHeight * gl.getPixelRatio();
            setDimensions([newWidth, newHeight]);
            fboA.setSize(newWidth, newHeight);
            fboB.setSize(newWidth, newHeight);
            simMaterial.uniforms.iResolution.value.set(newWidth, newHeight);
            
            // Recreate canvas and texture, update render material
            const { canvas, texture } = createNameTexture(newWidth, newHeight);
            canvasRef.current = canvas;
            setNameTexture(texture);
            renderMaterial.uniforms.iChannel1.value = texture;
        };
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [gl, fboA, fboB, simMaterial, renderMaterial]);
    
    // mouse event handlers
    useEffect(() => {
        function handlePointer(e) {
            const [w, h] = dimensionsRef.current;
            const x = (e.clientX / window.innerWidth) * w;
            const y = ((window.innerHeight - e.clientY) / window.innerHeight) * h;
            if (e.type === 'mousedown' && !hideUI){
                setToggleShader(!toggleShader);
            }
            if (hideUI) {
                setToggleShader(true);
            }
            setMouse({ x, y, z: toggleShader, w: 0 });
        }
        window.addEventListener('mousemove', handlePointer);
        window.addEventListener('mousedown', handlePointer);
        window.addEventListener('mouseup', handlePointer);
        return () => {
            window.removeEventListener('mousemove', handlePointer);
            window.removeEventListener('mousedown', handlePointer);
            window.removeEventListener('mouseup', handlePointer);
        };
    }, [toggleShader, hideUI]);
    
    // buffer swap state
    const bufferState = useRef({ src: fboA, dst: fboB });
    
    /* 
    RENDERING 
    */
    // simulation and rendering loop
    useFrame(() => {
        frameCount.current++;

        // swap buffers
        const { src, dst } = bufferState.current;
        bufferState.current = { src: dst, dst: src };
        
        // update uniforms
        simMaterial.uniforms.iFrame.value = frameCount.current;
        simMaterial.uniforms.iMouse.value.set(mouse.x, mouse.y, mouse.z, mouse.w);
        simMaterial.uniforms.iChannel0.value = src.texture;
        simMaterial.uniforms.delta.value = depth;
        simMaterial.uniforms.iPressure.value = pressure;
        // run simulation step in offscreen scene
        gl.setRenderTarget(dst);
        gl.render(simScene, simCameraRef.current);
        gl.setRenderTarget(null);
        
        // update render material with simulation result
        renderMaterial.uniforms.iChannel0.value = dst.texture;
        renderMaterial.uniforms.iChannel1.value = nameTexture;
    });
    
    // return the scene
    return (
        <>
        {/* onscreen render */}
            <mesh ref={ref}>
                <planeGeometry args={[viewport.width, viewport.height]} />
                <primitive object={renderMaterial} attach="material" />
            </mesh>z
        {/* offscreen simulation */}
        {createPortal(
        <>
            <mesh>
                <planeGeometry args={[2, 2]} />
                <primitive object={simMaterial} attach="material" />
            </mesh>
            <OrthographicCamera
                ref={simCameraRef}
                makeDefault={false}
                position={[0, 0, 1]}
                left={-1}
                right={1}
                top={1}
                bottom={-1}
                near={0}
                far={1}
            />
        </>,
            simScene
        )}
        </>
    );
}

