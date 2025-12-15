import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Fish as FishType, Rarity, CharacterConfig } from '../types';
import { Fish as FishIcon, Footprints, Zap, Cpu, Sparkles, Gem, Crown, Clock, Trash2, Map as MapIcon, Compass, X, Hammer } from 'lucide-react';

interface FishermanSceneProps {
  status: 'idle' | 'aiming' | 'casting' | 'waiting' | 'bited' | 'reeling' | 'caught';
  isVip: boolean;
  dockLevel: number;
  depthLevel: number;
  boatLevel?: number;
  caughtFish: FishType | null;
  characterConfig: CharacterConfig;
  castPower?: number;
  onNearShop?: (isNear: boolean) => void;
  onOpenShop?: () => void;
}

// --- SHADERS (Unchanged) ---
const skyVertexShader = `
varying vec3 vWorldPosition;
void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const skyFragmentShader = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
  float h = normalize(vWorldPosition + offset).y;
  gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
}
`;

const waterVertexShader = `
  uniform float uTime;
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float elevation = 0.0;
    
    elevation += sin(modelPosition.x * 0.3 + uTime * 0.6) * 0.4;
    elevation += sin(modelPosition.z * 0.25 + uTime * 0.5) * 0.4;
    
    elevation += sin((modelPosition.x + modelPosition.z) * 0.8 + uTime * 0.9) * 0.15;
    elevation -= cos((modelPosition.x - modelPosition.z) * 0.8 + uTime * 0.7) * 0.15;
    
    modelPosition.y += elevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vElevation = elevation;
  }
`;

const waterFragmentShader = `
  uniform vec3 uDepthColor;
  uniform vec3 uSurfaceColor;
  uniform vec3 uFoamColor;
  uniform float uOpacity;
  
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    float mixStrength = (vElevation + 0.6) * 0.5;
    mixStrength = clamp(mixStrength, 0.0, 1.0);
    
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    
    // Coastal foam
    if(vElevation > 0.3) {
        float foam = smoothstep(0.3, 0.5, vElevation);
        color = mix(color, uFoamColor, foam * 0.8);
    }
    
    gl_FragColor = vec4(color, uOpacity);
  }
`;

const getFishIcon = (name: string, className: string) => {
  switch (name) {
    case 'Old Boot': return <Footprints className={className} />;
    case 'Tin Can': return <Trash2 className={className} />;
    case 'Electric Ray': 
    case 'Neon Tetra':
    case 'Quantum Eel': return <Zap className={className} />;
    case 'Cyber Shark': return <Cpu className={className} />;
    case 'Void Glider': 
    case 'Galaxy Koi': return <Sparkles className={className} />;
    case 'Ruby Snapper': 
    case 'Sapphire Fin': return <Gem className={className} />;
    case 'Nano Bananafish': return <Crown className={className} />;
    case 'Chrono-Carp': return <Clock className={className} />;
    default: return <FishIcon className={className} />;
  }
};

const RarityGlow = {
  [Rarity.COMMON]: 'drop-shadow-[0_0_10px_rgba(148,163,184,0.8)] text-slate-200',
  [Rarity.RARE]: 'drop-shadow-[0_0_15px_rgba(96,165,250,0.8)] text-blue-300',
  [Rarity.EPIC]: 'drop-shadow-[0_0_20px_rgba(192,132,252,0.9)] text-purple-300',
  [Rarity.LEGENDARY]: 'drop-shadow-[0_0_25px_rgba(251,191,36,1)] text-amber-300',
};

// --- MESH CREATORS ---

const createPalmTree = () => {
    const group = new THREE.Group();
    // Trunk
    const trunkCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.2, 1.5, 0.1),
        new THREE.Vector3(0.5, 3, 0.2),
        new THREE.Vector3(1.2, 4.5, 0),
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 8, 0.3, 8, false);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    group.add(trunk);
    // Leaves
    const leavesGroup = new THREE.Group();
    leavesGroup.position.set(1.2, 4.2, 0);
    const leafGeo = new THREE.ConeGeometry(0.5, 2.5, 3);
    leafGeo.translate(0, 1.25, 0); // Pivot at base
    leafGeo.rotateX(Math.PI / 2); // Lay flat-ish
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.8, side: THREE.DoubleSide });
    for(let i=0; i<7; i++) {
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.rotation.y = (i / 7) * Math.PI * 2;
        leaf.rotation.z = -Math.PI / 4;
        leaf.scale.set(1, 1, Math.random() * 0.5 + 0.5); 
        leavesGroup.add(leaf);
    }
    group.add(leavesGroup);
    return group;
};

const createRock = (size: number) => {
    const geo = new THREE.DodecahedronGeometry(size, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, flatShading: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.scale.set(1, 0.6, 1);
    return mesh;
};

const createWoodenPier = (level: number) => {
    const group = new THREE.Group();
    const length = 5 + (level * 2);
    // Planks
    const plankGeo = new THREE.BoxGeometry(1.5, 0.1, 0.4);
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const numPlanks = Math.floor(length / 0.5);
    for(let i=0; i<numPlanks; i++) {
        const plank = new THREE.Mesh(plankGeo, plankMat);
        plank.position.set(0, 0, i * 0.5);
        plank.rotation.z = (Math.random() - 0.5) * 0.05; 
        group.add(plank);
    }
    // Posts
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 3);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const numPosts = Math.floor(length / 2);
    for(let i=0; i<=numPosts; i++) {
        const z = i * 2;
        const p1 = new THREE.Mesh(postGeo, postMat);
        p1.position.set(-0.6, -1.0, z);
        group.add(p1);
        const p2 = new THREE.Mesh(postGeo, postMat);
        p2.position.set(0.6, -1.0, z);
        group.add(p2);
    }
    return group;
};

const createShopMesh = () => {
    const group = new THREE.Group();
    
    // Stall Structure
    const base = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1.5), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
    base.position.y = 0.5;
    group.add(base);

    const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
    const p1 = new THREE.Mesh(poleGeo, poleMat); p1.position.set(-1.4, 1.25, 0.7); group.add(p1);
    const p2 = new THREE.Mesh(poleGeo, poleMat); p2.position.set(1.4, 1.25, 0.7); group.add(p2);
    const p3 = new THREE.Mesh(poleGeo, poleMat); p3.position.set(-1.4, 1.25, -0.7); group.add(p3);
    const p4 = new THREE.Mesh(poleGeo, poleMat); p4.position.set(1.4, 1.25, -0.7); group.add(p4);

    // Roof (Striped Canvas)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1, 4), new THREE.MeshStandardMaterial({ color: 0xff6b6b }));
    roof.position.y = 2.8;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1, 0.5, 0.7);
    group.add(roof);

    // NPC Character
    const npc = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8), new THREE.MeshStandardMaterial({ color: 0x22c55e })); // Green shirt
    body.position.y = 1.2;
    npc.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25), new THREE.MeshStandardMaterial({ color: 0xffd1a4 }));
    head.position.y = 1.7;
    npc.add(head);
    // Apron
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.6, 0.05), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    apron.position.set(0, 1.1, 0.3);
    npc.add(apron);
    
    npc.position.z = -0.5;
    group.add(npc);

    // Sign
    const sign = createLabelSprite("TRADE");
    if(sign) {
        sign.position.set(0, 3.5, 0);
        group.add(sign);
    }

    return group;
};

const createLabelSprite = (text: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    canvas.width = 256;
    canvas.height = 64;
    
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.roundRect(10, 5, 236, 54, 10);
    ctx.fill();
    ctx.strokeStyle = '#5c4033';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    ctx.font = 'bold 32px Courier New';
    ctx.fillStyle = '#fef3c7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(3, 0.75, 1);
    sprite.position.y = 0.8;
    return sprite;
};

const createFishMesh = (color: THREE.Color, isGlowing = false, label?: string) => {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ 
      color: color, roughness: 0.3, metalness: 0.1,
      emissive: isGlowing ? color : 0x000000, emissiveIntensity: isGlowing ? 0.8 : 0
  });
  const finMat = new THREE.MeshStandardMaterial({ 
      color: color.clone().multiplyScalar(0.8), roughness: 0.5, side: THREE.DoubleSide,
      emissive: isGlowing ? color : 0x000000, emissiveIntensity: isGlowing ? 0.4 : 0
  });
  const bodyGeo = new THREE.SphereGeometry(0.2, 12, 12);
  bodyGeo.scale(0.5, 0.8, 1.5);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0, -0.25);
  group.add(tailGroup);
  const tailGeo = new THREE.BufferGeometry();
  const tailVertices = new Float32Array([0, 0, 0, 0, 0.25, -0.4, 0, -0.25, -0.4]);
  tailGeo.setAttribute('position', new THREE.BufferAttribute(tailVertices, 3));
  tailGeo.computeVertexNormals();
  const tail = new THREE.Mesh(tailGeo, finMat);
  tailGroup.add(tail);
  const dorsalGeo = new THREE.BufferGeometry();
  const dorsalVertices = new Float32Array([0, 0.1, 0, 0, 0.3, -0.2, 0, 0.1, -0.3]);
  dorsalGeo.setAttribute('position', new THREE.BufferAttribute(dorsalVertices, 3));
  dorsalGeo.computeVertexNormals();
  const dorsal = new THREE.Mesh(dorsalGeo, finMat);
  body.add(dorsal);
  if (label) {
      const sprite = createLabelSprite(label);
      if (sprite) group.add(sprite);
  }
  group.userData.parts = { tail: tailGroup, body: body };
  return group;
};

const createRaftMesh = () => {
    const group = new THREE.Group();
    const logGeo = new THREE.CylinderGeometry(0.25, 0.25, 3, 8);
    logGeo.rotateZ(Math.PI / 2);
    const logMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    for(let i=0; i<6; i++) {
        const log = new THREE.Mesh(logGeo, logMat);
        log.position.z = (i - 2.5) * 0.5;
        group.add(log);
    }
    const beamGeo = new THREE.BoxGeometry(0.2, 0.2, 3);
    const beam1 = new THREE.Mesh(beamGeo, logMat);
    beam1.position.set(-1, 0.2, 0);
    group.add(beam1);
    const beam2 = new THREE.Mesh(beamGeo, logMat);
    beam2.position.set(1, 0.2, 0);
    group.add(beam2);
    return group;
};

const createSurvivorMesh = (config: CharacterConfig) => {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: config.skinColor, roughness: 0.8 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: config.shirtColor, roughness: 1.0 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: config.pantsColor, roughness: 0.9 });
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 1.0 });

    const torsoGeo = new THREE.CylinderGeometry(0.28, 0.25, 0.7, 8);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.05;
    group.add(torso);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.15), skinMat);
    neck.position.y = 1.45;
    group.add(neck);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), skinMat);
    head.position.y = 1.65;
    group.add(head);

    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.7);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(0.32, 1.1, 0);
    leftArm.rotation.z = -0.2;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(-0.32, 1.1, 0.1);
    rightArm.rotation.z = 0.2;
    rightArm.rotation.x = -0.5;
    group.add(rightArm);

    const hips = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.3), pantsMat);
    hips.position.y = 0.6;
    group.add(hips);

    const pantLegGeo = new THREE.CylinderGeometry(0.13, 0.15, 0.45);
    const leftPant = new THREE.Mesh(pantLegGeo, pantsMat);
    leftPant.position.set(0.15, 0.35, 0);
    group.add(leftPant);
    const rightPant = new THREE.Mesh(pantLegGeo, pantsMat);
    rightPant.position.set(-0.15, 0.35, 0);
    group.add(rightPant);

    const lowerLegGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.3);
    const leftLeg = new THREE.Mesh(lowerLegGeo, skinMat);
    leftLeg.position.set(0.15, 0.0, 0);
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(lowerLegGeo, skinMat);
    rightLeg.position.set(-0.15, 0.0, 0);
    group.add(rightLeg);

    const footGeo = new THREE.BoxGeometry(0.1, 0.08, 0.22);
    const leftFoot = new THREE.Mesh(footGeo, skinMat);
    leftFoot.position.set(0.15, -0.15, 0.05);
    group.add(leftFoot);
    const rightFoot = new THREE.Mesh(footGeo, skinMat);
    rightFoot.position.set(-0.15, -0.15, 0.05);
    group.add(rightFoot);

    const beltGeo = new THREE.TorusGeometry(0.27, 0.04, 8, 20);
    const belt = new THREE.Mesh(beltGeo, ropeMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.75;
    group.add(belt);

    return group;
}

export const FishermanScene: React.FC<FishermanSceneProps> = ({ 
    status, isVip, dockLevel, depthLevel, boatLevel = 1, caughtFish, characterConfig, castPower = 50,
    onNearShop, onOpenShop 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const rodRef = useRef<THREE.Group | null>(null);
  const lineRef = useRef<THREE.Line | null>(null);
  const bobberRef = useRef<THREE.Mesh | null>(null);
  const waterMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const fishSchoolRef = useRef<THREE.Group | null>(null);
  const splashRef = useRef<THREE.Points | null>(null); 
  const caughtFishMeshRef = useRef<THREE.Group | null>(null);
  const tileGroupRef = useRef<THREE.Group | null>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);
  const npcShopRef = useRef<THREE.Group | null>(null);

  const [visualCatch, setVisualCatch] = useState<{ x: number; y: number; fish: FishType } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const keys = useRef<{ [key: string]: boolean }>({});
  const playerPosRef = useRef(new THREE.Vector3(-6, 0.3, 0)); // Initial position on pier/shore

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { 
        if (e.key.toLowerCase() === 'e' && onOpenShop) {
             // Interaction check handled in animate loop via flag or distance
             if (playerPosRef.current.distanceTo(new THREE.Vector3(-12, 0, -6)) < 3.5) {
                 onOpenShop();
             }
        }
        keys.current[e.key.toLowerCase()] = false; 
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onOpenShop]);

  useEffect(() => {
    if (status !== 'caught' && caughtFishMeshRef.current && playerRef.current) {
         caughtFishMeshRef.current.parent?.remove(caughtFishMeshRef.current);
         caughtFishMeshRef.current = null;
    }
  }, [status]);

  useEffect(() => {
    if (caughtFish && bobberRef.current && cameraRef.current && mountRef.current) {
      const bobberPos = new THREE.Vector3();
      bobberRef.current.getWorldPosition(bobberPos);
      bobberPos.project(cameraRef.current);
      const x = (bobberPos.x * 0.5 + 0.5) * mountRef.current.clientWidth;
      const y = (-(bobberPos.y * 0.5) + 0.5) * mountRef.current.clientHeight;
      setVisualCatch({ x, y, fish: caughtFish });
      const timer = setTimeout(() => setVisualCatch(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [caughtFish]);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.Fog(0x87CEEB, 20, 100); 

    const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 200);
    // Initial Camera
    camera.position.set(-15, 8, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.8);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.5);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Sky
    const skyGeo = new THREE.SphereGeometry(100, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: skyVertexShader, fragmentShader: skyFragmentShader,
      uniforms: {
        topColor: { value: new THREE.Color(0x38bdf8) },
        bottomColor: { value: new THREE.Color(0xffffff) },
        offset: { value: 33 }, exponent: { value: 0.6 }
      },
      side: THREE.BackSide
    });
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Environment
    const islandGeo = new THREE.CylinderGeometry(15, 18, 5, 32);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0xf6d7b0, roughness: 1.0 });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(-20, -2.5, -5);
    island.receiveShadow = true;
    scene.add(island);

    const tree1 = createPalmTree(); tree1.position.set(-15, 0, -8); tree1.rotation.y = Math.random(); scene.add(tree1);
    const tree2 = createPalmTree(); tree2.position.set(-18, 0, -2); tree2.scale.setScalar(0.8); tree2.rotation.y = Math.random(); scene.add(tree2);
    const rock1 = createRock(1.5); rock1.position.set(-8, 0, 5); scene.add(rock1);

    // NPC Shop
    const shop = createShopMesh();
    shop.position.set(-12, 0, -6);
    shop.rotation.y = Math.PI / 4;
    scene.add(shop);
    npcShopRef.current = shop;

    // Pier
    const pier = createWoodenPier(dockLevel);
    pier.position.set(-6, 0.2, 0);
    pier.rotation.y = Math.PI / 2;
    scene.add(pier);

    // Water
    const waterGeometry = new THREE.PlaneGeometry(120, 120, 128, 128);
    const waterMaterial = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader, fragmentShader: waterFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDepthColor: { value: new THREE.Color('#0066aa') }, 
        uSurfaceColor: { value: new THREE.Color('#44ddff') },
        uFoamColor: { value: new THREE.Color('#ffffff') },
        uOpacity: { value: 0.8 },
      },
      transparent: true, side: THREE.DoubleSide
    });
    waterMaterialRef.current = waterMaterial;
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.5;
    scene.add(water);

    // Player
    const playerGroup = new THREE.Group();
    playerRef.current = playerGroup;
    scene.add(playerGroup);
    
    // Set initial player pos based on mode
    if (boatLevel && boatLevel >= 2) {
        // Boat Mode
        const raft = createRaftMesh();
        raft.position.set(10, -0.4, 10);
        raft.userData = { isRaft: true };
        scene.add(raft);
        playerPosRef.current.set(10, 0, 10);
    } else {
        // Pier Mode
        const pierLength = 5 + (dockLevel * 2);
        playerPosRef.current.set(-6 + (pierLength / 2), 0.3, 0);
    }
    playerGroup.position.copy(playerPosRef.current);
    playerGroup.rotation.y = -Math.PI / 2;

    const survivorMesh = createSurvivorMesh(characterConfig);
    playerGroup.add(survivorMesh);
    
    const rodGroup = new THREE.Group();
    rodGroup.position.set(-0.32, 0.8, 0.27);
    playerGroup.add(rodGroup);
    rodRef.current = rodGroup;
    const rodMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 3.5), new THREE.MeshStandardMaterial({ color: 0x8b5a2b }));
    rodMesh.rotation.x = Math.PI / 2; 
    rodMesh.position.z = 1.75; 
    rodGroup.add(rodMesh);

    // Line & Bobber
    const bobberMat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
    const bobber = new THREE.Mesh(new THREE.SphereGeometry(0.1), bobberMat);
    bobber.visible = false;
    scene.add(bobber);
    bobberRef.current = bobber;
    
    const lineGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(90), 3));
    const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }));
    scene.add(line);
    lineRef.current = line;

    // Particles/Decor
    const splashGeo = new THREE.BufferGeometry();
    const splashPos = new Float32Array(300);
    const splashVel = new Float32Array(300);
    splashGeo.setAttribute('position', new THREE.BufferAttribute(splashPos, 3));
    const splashParticles = new THREE.Points(splashGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0.8 }));
    splashParticles.userData = { active: false, time: 0, velocities: splashVel };
    scene.add(splashParticles);
    splashRef.current = splashParticles;

    // Fish
    const fishSchoolGroup = new THREE.Group();
    fishSchoolRef.current = fishSchoolGroup;
    scene.add(fishSchoolGroup);
    for (let i = 0; i < 20; i++) {
        const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.5);
        const fish = createFishMesh(color);
        fish.userData = {
            center: new THREE.Vector2(10 + (Math.random()-0.5)*20, 10 + (Math.random()-0.5)*20),
            radiusX: 3 + Math.random() * 5, radiusZ: 3 + Math.random() * 5,
            speed: 0.1 + Math.random() * 0.2, phase: Math.random() * Math.PI * 2,
            yBase: -1.5 - Math.random() * 3.0, direction: Math.random() > 0.5 ? 1 : -1
        };
        fishSchoolGroup.add(fish);
    }

    // --- ANIMATION LOOP ---
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.05;
      
      // Player Movement Logic
      // Only allow movement if idle (not fishing)
      if (status === 'idle' && playerRef.current) {
          const speed = 0.15;
          let moved = false;
          const moveDir = new THREE.Vector3(0, 0, 0);

          if (keys.current['w'] || keys.current['arrowup']) { moveDir.x -= 1; moved = true; }
          if (keys.current['s'] || keys.current['arrowdown']) { moveDir.x += 1; moved = true; }
          if (keys.current['a'] || keys.current['arrowleft']) { moveDir.z -= 1; moved = true; }
          if (keys.current['d'] || keys.current['arrowright']) { moveDir.z += 1; moved = true; }

          if (moved) {
              moveDir.normalize().multiplyScalar(speed);
              
              // Rotate vector based on camera angle (approximately) or just use world aligned for simple isometric feel
              // Let's use world aligned for consistency with the map
              const nextPos = playerPosRef.current.clone().add(new THREE.Vector3(moveDir.x, 0, moveDir.z));
              
              // Simple Bounds Check (Island Radius approx 20, but center is offset)
              const distToIslandCenter = new THREE.Vector2(nextPos.x + 15, nextPos.z + 5).length();
              const onIsland = distToIslandCenter < 12;
              
              const pierLength = 5 + (dockLevel * 2);
              const onPier = (nextPos.x > -8 && nextPos.x < (-6 + pierLength) && Math.abs(nextPos.z) < 1.5);
              
              // Allow movement if on Island OR on Pier
              if (onIsland || onPier || (boatLevel && boatLevel >= 2)) {
                  playerPosRef.current.copy(nextPos);
                  
                  // Rotate player to face movement
                  const angle = Math.atan2(moveDir.z, moveDir.x);
                  playerRef.current.rotation.y = -angle;
                  
                  // Bobbing animation
                  playerRef.current.position.y = 0.3 + Math.sin(time * 2) * 0.05;
              }
          }
          
          playerRef.current.position.x = playerPosRef.current.x;
          playerRef.current.position.z = playerPosRef.current.z;

          // Camera Follow
          const targetCamPos = new THREE.Vector3(
              playerPosRef.current.x - 15, 
              playerPosRef.current.y + 12, 
              playerPosRef.current.z + 15
          );
          camera.position.lerp(targetCamPos, 0.1);
          controls.target.lerp(playerRef.current.position, 0.1);
          
          // NPC Interaction Check
          if (npcShopRef.current) {
             const dist = playerPosRef.current.distanceTo(npcShopRef.current.position);
             if (onNearShop) onNearShop(dist < 3.5);
          }
      } else {
           // Camera reset for fishing view or stay put? Stay put is better for continuity.
           controls.update();
      }

      if (waterMaterialRef.current) waterMaterialRef.current.uniforms.uTime.value = time;

      // ... Fish School Animation ...
      if (fishSchoolRef.current) {
        fishSchoolRef.current.children.forEach((fish) => {
            const u = fish.userData;
            const t = time * u.speed;
            const x = u.center.x + Math.cos(t * u.direction + u.phase) * u.radiusX;
            const z = u.center.y + Math.sin(t * u.direction + u.phase) * u.radiusZ;
            fish.position.set(x, u.yBase, z);
            fish.rotation.y = Math.atan2(-Math.cos(t*u.direction), Math.sin(t*u.direction)) + (u.direction < 0 ? Math.PI : 0);
        });
      }
      
      // ... Splash Animation ...
      if (splashRef.current && splashRef.current.userData.active) {
          const s = splashRef.current;
          const pos = s.geometry.attributes.position.array as Float32Array;
          const vel = s.userData.velocities as Float32Array;
          s.userData.time += 0.02;
          for(let i=0; i<100; i++) {
              if (pos[i*3+1] > -2) { 
                  pos[i*3] += vel[i*3];
                  pos[i*3+1] += vel[i*3+1];
                  pos[i*3+2] += vel[i*3+2];
                  vel[i*3+1] -= 0.01;
              }
          }
          s.geometry.attributes.position.needsUpdate = true;
          (s.material as THREE.PointsMaterial).opacity = Math.max(0, 1.0 - s.userData.time);
          if (s.userData.time > 1.0) { s.userData.active = false; s.visible = false; }
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
        if (mountRef.current) {
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [dockLevel, boatLevel, characterConfig, status]); // Dependencies reset scene if changed

  // Visual Effects loop for rod/line and bobber
  useEffect(() => {
    if (!rodRef.current || !playerRef.current) return;

    // Trigger Splash
    if ((status === 'caught' || status === 'reeling') && splashRef.current && bobberRef.current) {
        if (!splashRef.current.userData.active) {
            splashRef.current.visible = true;
            splashRef.current.userData.active = true;
            splashRef.current.userData.time = 0;
            const bPos = bobberRef.current.position;
            const pos = splashRef.current.geometry.attributes.position.array as Float32Array;
            const vel = splashRef.current.userData.velocities as Float32Array;
            
            for(let i=0; i<100; i++) {
                pos[i*3] = bPos.x + (Math.random()-0.5)*0.5;
                pos[i*3+1] = bPos.y;
                pos[i*3+2] = bPos.z + (Math.random()-0.5)*0.5;
                vel[i*3] = (Math.random()-0.5) * 0.2;
                vel[i*3+1] = Math.random() * 0.3 + 0.1; 
                vel[i*3+2] = (Math.random()-0.5) * 0.2;
            }
            splashRef.current.geometry.attributes.position.needsUpdate = true;
        }
    }

    const startTime = Date.now();
    const animateStatus = () => {
        const now = Date.now();
        const elapsed = now - startTime;

        if (status === 'aiming') {
             rodRef.current!.rotation.x = -Math.PI / 8; // Aim up slightly
             rodRef.current!.position.z = 0.2; // Pull back
        } else if (status === 'casting') {
            if (elapsed < 300) rodRef.current!.rotation.x = -0.4 * Math.sin((elapsed / 300) * Math.PI / 2); // Pull back more
            else if (elapsed < 600) rodRef.current!.rotation.x = -0.4 + (1.2 * Math.pow(((elapsed - 300) / 300), 2)); // Snap forward
            else rodRef.current!.rotation.x = 0.8 - (0.8 - 0) * Math.min(1, (elapsed - 600) / 400); // Settle
        } else if (status === 'waiting' || status === 'bited' || status === 'reeling' || status === 'caught') {
            rodRef.current!.position.set(-0.32, 0.8, 0.27); // Reset to hand pos
            
            if (status === 'reeling') {
                rodRef.current!.rotation.x = 0.2 + Math.sin(now * 0.02) * 0.1;
            } else if (status === 'caught') {
                rodRef.current!.rotation.x = 0.6; // Bend down under weight
            } else {
                rodRef.current!.rotation.x = 0; // Neutral hold
            }

            if (lineRef.current) {
                const rodBase = new THREE.Vector3(-0.32, 0.8, 0.27);
                rodBase.applyMatrix4(playerRef.current!.matrixWorld);
                // Tip is roughly forward + up relative to rod rotation
                const rodLen = 3.5;
                // Since Rod is inside Player Group (rotated Y), we need to handle local rotations properly
                // Simple approx: Rod is rotated X locally. Player is rotated Y world.
                const rodRotX = rodRef.current!.rotation.x;
                const playerRotY = playerRef.current!.rotation.y;
                
                // Tip in Rod Local Space (Z-forward rod)
                const localTip = new THREE.Vector3(0, Math.sin(rodRotX) * rodLen, Math.cos(rodRotX) * rodLen + 1.75); // +1.75 offset
                localTip.applyAxisAngle(new THREE.Vector3(0,1,0), playerRotY);
                const rodTipX = playerRef.current!.position.x + localTip.x + (-0.32 * Math.cos(playerRotY) - 0.27 * Math.sin(playerRotY)); // Hand offset approx
                const rodTipY = playerRef.current!.position.y + 0.8 + localTip.y;
                const rodTipZ = playerRef.current!.position.z + localTip.z + (0.32 * Math.sin(playerRotY) - 0.27 * Math.cos(playerRotY));

                // Determine Target Bobber Position
                const maxDist = 10 + (castPower / 100) * 15;
                // Assuming standard cast direction relative to player
                const castDirX = Math.sin(playerRotY); 
                const castDirZ = Math.cos(playerRotY);
                
                let targetX = playerRef.current!.position.x + castDirX * maxDist;
                let targetZ = playerRef.current!.position.z + castDirZ * maxDist;
                let targetY = -0.5;

                if (status === 'reeling') {
                     // Interpolate based on elapsed time to simulate reeling in
                     const progress = Math.min(1, elapsed / 1000); // 1s reel time
                     // Start from cast point, end at rod tip
                     targetX = targetX + (rodTipX - targetX) * progress;
                     targetZ = targetZ + (rodTipZ - targetZ) * progress;
                     targetY = -0.5 + (rodTipY - 1 - -0.5) * progress; // Lift out of water
                     
                     // Add struggle shake
                     targetX += (Math.random() - 0.5) * 0.2;
                     targetY += (Math.random() - 0.5) * 0.2;
                     targetZ += (Math.random() - 0.5) * 0.2;
                } else if (status === 'caught') {
                     targetX = rodTipX;
                     targetY = rodTipY - 1;
                     targetZ = rodTipZ;
                } else if (status === 'bited') {
                     // Violent shaking
                     targetX += (Math.random() - 0.5) * 0.3;
                     targetZ += (Math.random() - 0.5) * 0.3;
                     targetY = -0.5 + Math.sin(now * 0.02) * 0.3; // Bob up and down vigorously
                     
                     // Color Flash
                     if (bobberRef.current) {
                         const mat = bobberRef.current.material as THREE.MeshStandardMaterial;
                         const flash = Math.floor(now / 100) % 2 === 0;
                         mat.color.setHex(flash ? 0xffffff : 0xff4444);
                         mat.emissive.setHex(flash ? 0xffaaaa : 0x000000);
                         mat.emissiveIntensity = flash ? 1 : 0;
                     }
                } else if (status === 'waiting') {
                     // Gentle bobbing
                     targetY = -0.5 + Math.sin(now * 0.003) * 0.1;
                     // Reset Color
                     if (bobberRef.current) {
                         (bobberRef.current.material as THREE.MeshStandardMaterial).color.setHex(0xff4444);
                         (bobberRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
                     }
                } else {
                     // Reset Color
                     if (bobberRef.current) {
                         (bobberRef.current.material as THREE.MeshStandardMaterial).color.setHex(0xff4444);
                         (bobberRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
                     }
                }

                if (status === 'caught' && caughtFishMeshRef.current) {
                    caughtFishMeshRef.current.position.set(targetX, targetY, targetZ);
                }

                if (bobberRef.current) {
                    bobberRef.current.position.set(targetX, targetY, targetZ);
                    bobberRef.current.visible = true;
                }

                // Line Update
                const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
                
                // Curve logic
                let tension = 0;
                if (status === 'waiting') tension = 2.0;
                if (status === 'bited') tension = 1.0 + Math.sin(now * 0.05); // Tugging line
                if (status === 'reeling') tension = 0; // Taut
                if (status === 'caught') tension = 0;
                if (status === 'casting') tension = 1.0 * (1 - Math.min(1, elapsed/600)); // Straighten out

                for (let i = 0; i < 30; i++) {
                    const t = i / 29;
                    positions[i*3] = rodTipX + (targetX - rodTipX) * t;
                    positions[i*3+1] = rodTipY + (targetY - rodTipY) * t - Math.sin(t * Math.PI) * tension;
                    positions[i*3+2] = rodTipZ + (targetZ - rodTipZ) * t;
                }
                lineRef.current.geometry.attributes.position.needsUpdate = true;
            }
        } else {
             if (bobberRef.current) bobberRef.current.visible = false;
        }
        
        requestAnimationFrame(animateStatus);
    };
    const animId = requestAnimationFrame(animateStatus);
    return () => cancelAnimationFrame(animId);

  }, [status, castPower, caughtFish]);

  return (
    <div className="w-full h-full relative group cursor-move">
       <div ref={mountRef} className="w-full h-full rounded-xl overflow-hidden shadow-2xl border-4 border-amber-900/50 bg-sky-200" />
       
       {!showMap && (
        <button 
            onClick={() => setShowMap(true)}
            className="absolute bottom-4 right-4 bg-amber-900/80 p-3 rounded-full border-2 border-amber-600 shadow-xl text-amber-100 hover:scale-110 transition-all z-20"
        >
            <MapIcon className="w-6 h-6" />
        </button>
       )}

       {showMap && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-sm aspect-square bg-slate-900 rounded-2xl border-4 border-amber-700 overflow-hidden">
                <canvas ref={miniMapRef} width={300} height={300} className="w-full h-full" />
                <button 
                    onClick={() => setShowMap(false)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
       )}

       {visualCatch && status !== 'caught' && (
        <div 
          className="absolute pointer-events-none flex flex-col items-center justify-center animate-out fade-out slide-out-to-top-12 duration-1000 fill-mode-forwards"
          style={{ 
            left: visualCatch.x, 
            top: visualCatch.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="animate-[bounce_0.5s_infinite] mb-2">
            {getFishIcon(visualCatch.fish.name, `w-16 h-16 ${RarityGlow[visualCatch.fish.rarity]}`)}
          </div>
          <span className="text-sm font-bold bg-amber-950/80 text-amber-100 px-2 py-1 rounded border border-amber-500/50">
            {visualCatch.fish.name}
          </span>
        </div>
       )}
    </div>
  );
};