# **[markpeng.me](https://www.markpeng.me)**


my personal website created with [Next.js](https://nextjs.org) and [Tailwind CSS](https://tailwindcss.com)

## Technologies

the base is done in [Next.js](https://nextjs.org) and [Tailwind CSS](https://tailwindcss.com)

majority of animations are done with [Framer Motion](https://motion.dev)

the hero shader is done using [Three.js](http://threejs.org/) and [React Three Fiber](https://github.com/pmndrs/react-three-fiber).


## Credits
SVGs can be found on svgrepo.

the base design is slightly inspired by [this website](https://www.phillipche.com/), check it out!

almost all of the code is of mine, except for the GLSL shaders which are an adapted version of the shaders found on a shader in [shadertoy](https://www.shadertoy.com/view/wdtyDH). 

## The Shader
The hero shader was by far the most complex thing on the website and took a while to implement with little to no documentation, so let's talk about how it happened!

I was first introduced to this shader and effect from this [youtube tutorial](https://www.youtube.com/watch?v=DncmUVn1Yfg), and quickly decided I wanted to implement a similar thing. Given that this tutorial was using raw three.js and javascript as a whole, I figured that the act of translating it into react would be a fun little weekend exercise, but it was not the case, and multiple attempts of replication failed. Ultimately, I gave up, and by the end, if you compare to the code from the tutorial to the code found in the repository, there are major differences in implementation.

However, the tutorial did give me a good starting base to go off of, demonstrating how the shader could be implemented ontop of a canvas texture and use a buffer ping-pong texture style shader to create the illusionary effect, which is something I decided to work towards.

After multiple failed implementations trying to directly emulate the tutorial and my own (uninformed and unknowing) approaches, I turned to other resources online to learn more about how it works. Given my multipe failed attempts, I was beginning to lose hope and wondered if it was possible while using react-three-fiber rather than raw three.js. Thankfully, I stumbled across [this  blog](https://www.thefrontdev.co.uk/workflow-from-shadertoy-to-react-three-fiber-r3f) on which also used react-three-fiber to implement its own pingpong approach for a different shader. Although the shader was much simpler, it opened my eyes to many new functions and approaches in how it could possibly be implemented. 

Following the same approach as the blog, I created two frame buffer objects (useFBO) to represent to textures which two shaders would apply to: one which was for simulating the water, and the other for rendering. Then, using createPortal, we can pass the rendered component into the simulation scene, to continue the feedback loop and create the water effect.

Without those two resources, this hero shader could have never become alive. Biggest credit to that blog which pretty much saved this entire project. 
