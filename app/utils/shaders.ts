export const simMaterialVertexShader = `
    varying vec2 vUv;
    void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

export const simMaterialFragmentShader = `
    uniform int iFrame; // frame number
    uniform vec4 iMouse;
    uniform vec2 iResolution;
    uniform sampler2D iChannel0; // our input texture
    uniform float delta;
    uniform float iPressure;
    uniform float iFPS; // current FPS
    uniform float iTexelSizeMultiplier; // texel size multiplier for FPS adjustment
    varying vec2 vUv;

    //const float delta = 1.3;

    void main() {
        // Convert vUv to fragCoord (pixel coordinates)
        vec2 fragCoord = vUv * iResolution;
        vec4 fragColor;

        if (iFrame == 0) {
            fragColor = vec4(0.0);
        } else {
            // Sample at current position
            vec2 uv = vUv;
            float pressure = texture2D(iChannel0, uv).x;
            float pVel = texture2D(iChannel0, uv).y;

            // Sample neighboring pixels
            vec2 texelSize = (1.0 / iResolution) * iTexelSizeMultiplier;
            vec2 uv_right = uv + vec2(texelSize.x, 0.0);
            vec2 uv_left = uv + vec2(-texelSize.x, 0.0);
            vec2 uv_up = uv + vec2(0.0, texelSize.y);
            vec2 uv_down = uv + vec2(0.0, -texelSize.y);

            float p_right = texture2D(iChannel0, uv_right).x;
            float p_left = texture2D(iChannel0, uv_left).x;
            float p_up = texture2D(iChannel0, uv_up).x;
            float p_down = texture2D(iChannel0, uv_down).x;

            // Boundary handling
            if (fragCoord.x <= 1.0) p_left = p_right;
            if (fragCoord.x >= iResolution.x - 1.0) p_right = p_left;
            if (fragCoord.y <= 1.0) p_down = p_up;
            if (fragCoord.y >= iResolution.y - 1.0) p_up = p_down;

            // Apply horizontal wave function
            pVel += delta * (-2.0 * pressure + p_right + p_left) / 4.0;
            // Apply vertical wave function
            pVel += delta * (-2.0 * pressure + p_up + p_down) / 4.0;
            
            // Change pressure by pressure velocity
            pressure += delta * pVel;
            
            // "Spring" motion
            pVel -= 0.005 * delta * pressure;
            
            // Velocity damping
            pVel *= 1.0 - 0.002 * delta;
            
            // Pressure damping
            pressure *= iPressure;
            
            // Output: x = pressure, y = pressure velocity, z/w = x/y gradients
            fragColor = vec4(pressure, pVel, (p_right - p_left) / 2.0, (p_up - p_down) / 2.0);
            
            // Mouse interaction
            if (iMouse.z == 1.0) {
                float dist = distance(fragCoord, iMouse.xy);
                if (dist <= 20.0) {
                    fragColor.x += 1.0 - dist / 20.0;
                }
            }   
        }
        gl_FragColor = fragColor;
    }
`

export const renderMaterialVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }

`
export const renderMaterialFragmentShader = `
    // uniform vec2 iResolution; not sure i need it?
    uniform sampler2D iChannel0;
    uniform sampler2D iChannel1;
    varying vec2 vUv;

    void main() {
        vec2 uv = vUv;
        vec4 data = texture2D(iChannel0, uv);
        
        // Color = texture with distortion
        vec4 fragColor = texture2D(iChannel1, uv + 0.2 * data.zw);
        
        // Sunlight glint
        vec3 normal = normalize(vec3(-data.z, 0.2, -data.w));
        fragColor += vec4(1.0, 1.0, 1.0, 1.0) * pow(max(0.0, dot(normal, normalize(vec3(-3.0, 10.0, 3.0)))), 60.0);
        
        gl_FragColor = fragColor;
    }
`
