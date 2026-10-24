import * as T from 'three';

export type CharacterSurface = 'skin' | 'face' | 'hair' | 'cloth' | 'metal';

/** Art-directed night lighting, kept below bloom exposure. Shares the original
 * material's texture/face hooks and works in the reflection camera as well. */
export function shadeCharacter(material:T.MeshBasicMaterial, surface:CharacterSurface){
 const previous=material.onBeforeCompile;
 const previousKey=material.customProgramCacheKey();
 material.userData.characterSurface=surface;
 material.onBeforeCompile=(shader,renderer)=>{
  previous.call(material,shader,renderer);
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
   varying vec3 vNoirNormal;
   varying vec3 vNoirWorld;
   varying vec3 vNoirLocal;
  `).replace('#include <project_vertex>',`#include <project_vertex>
   vNoirNormal=inverseTransformDirection(normalize(normalMatrix*normal),viewMatrix);
   vNoirWorld=(modelMatrix*vec4(transformed,1.0)).xyz;
   vNoirLocal=transformed;
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vNoirNormal;
   varying vec3 vNoirWorld;
   varying vec3 vNoirLocal;
  `);
  if(surface==='hair')shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   #ifdef USE_MAP
    vec3 hairSample=texture2D(map,vMapUv).rgb;
    float pigment=dot(hairSample,vec3(.2126,.7152,.0722));
    diffuseColor.rgb*=mix(vec3(.78,.80,.91),vec3(1.08),smoothstep(.002,.16,pigment));
   #endif
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
   vec3 n=normalize(vNoirNormal);
   n*=gl_FrontFacing?1.0:-1.0;
   vec3 eye=normalize(cameraPosition-vNoirWorld);
   float key=dot(n,normalize(vec3(-.48,.72,.55)));
   float cel=smoothstep(-.02,.36,key)*.64+smoothstep(.52,.78,key)*.36;
   vec3 lightTint=mix(vec3(.48,.55,.76),vec3(.97,.94,1.0),cel);
   float warm=max(0.,dot(n,normalize(vec3(-.65,.25,-.65))));
   lightTint+=vec3(.11,.055,.015)*warm;
   float rim=pow(1.0-max(0.,dot(n,eye)),3.0)*smoothstep(-.3,.7,n.x+n.y*.3);
   outgoingLight*=lightTint;
   ${surface==='skin'||surface==='face'?`
    float neckContact=exp(-pow((vNoirWorld.y-3.43)/.095,2.0))*exp(-pow(vNoirWorld.x/.13,2.0));
    outgoingLight*=1.0-.18*neckContact;
    float hemContact=exp(-pow((vNoirWorld.y-2.38)/.10,2.0))*(1.0-smoothstep(.20,.29,abs(vNoirWorld.x)));
    outgoingLight*=1.0-.22*hemContact;
    outgoingLight+=vec3(.035,.045,.075)*rim;
   `:surface==='hair'?`
    float band=exp(-pow((vNoirLocal.y-.17)/.045,2.0));
    float ribbon=pow(max(0.,n.z*.82+n.y*.3),2.0);
    outgoingLight+=vec3(.085,.10,.15)*band*ribbon;
    outgoingLight+=vec3(.05,.065,.105)*rim;
   `:surface==='metal'?`
    outgoingLight+=vec3(.24,.27,.34)*pow(max(0.,dot(reflect(-normalize(vec3(-.48,.72,.55)),n),eye)),24.0);
   `:`
    outgoingLight+=vec3(.018,.025,.05)*rim;
   `}
   #include <opaque_fragment>
  `);
 };
 material.customProgramCacheKey=()=>`${previousKey}:noir-night-${surface}-v1`;
 return material;
}

export function characterMaterial(color:number,surface:CharacterSurface){
 return shadeCharacter(new T.MeshBasicMaterial({color,toneMapped:false,side:T.DoubleSide}),surface);
}
