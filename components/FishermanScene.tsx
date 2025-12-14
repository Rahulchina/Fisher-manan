import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Fish as FishType, Rarity } from '../types';
import { Fish as FishIcon, Footprints, Zap, Cpu, Sparkles, Gem, Crown, Clock, Trash2 } from 'lucide-react';

interface FishermanSceneProps {
  status: 'idle' | 'casting' | 'waiting' | 'bited' | 'reeling';
  isVip: boolean;
  dockLevel: number;
  depthLevel: number;
  caughtFish: FishType | null;
}

// --- SHADERS ---
// Using a sum of sines to approximate Gerstner waves for realistic motion
const waterVertexShader = `
  uniform float uTime;
  varying float vElevation;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float elevation = 0.0;
    
    // Layer 1: Large Swells (Deep ocean feel)
    elevation += sin(modelPosition.x * 0.3 + uTime * 0.6) * 0.4;
    elevation += sin(modelPosition.z * 0.25 + uTime * 0.5) * 0.4;
    
    // Layer 2: Medium Chop (Crossing waves)
    elevation += sin((modelPosition.x + modelPosition.z) * 0.8 + uTime * 0.9) * 0.15;
    elevation -= cos((modelPosition.x - modelPosition.z) * 0.8 + uTime * 0.7) * 0.15;

    // Layer 3: Surface Ripples (High frequency)
    elevation += sin(modelPosition.x * 3.5 - uTime * 2.0) * 0.05;
    elevation += cos(modelPosition.z * 3.0 + uTime * 1.8) * 0.05;
    
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
    // Color mixing based on elevation (peaks are lighter, troughs are darker)
    float mixStrength = (vElevation + 0.8) * 0.6;
    mixStrength = clamp(mixStrength, 0.0, 1.0);
    
    vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
    
    // Dynamic Foam caps at highest peaks
    // Using smoothstep to create a sharp but anti-aliased edge
    if(vElevation > 0.45) {
        float foam = smoothstep(0.45, 0.55, vElevation);
        // Add some noise to foam edge if possible, or just solid
        color = mix(color, uFoamColor, foam * 0.9);
    }
    
    // Dynamic opacity based on depth level via uniform
    gl_FragColor = vec4(color, uOpacity);
  }
`;

// Helper for icon (duplicated to avoid circular deps or major refactors)
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

export const FishermanScene: React.FC<FishermanSceneProps> = ({ status, isVip, dockLevel, depthLevel, caughtFish }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const rodRef = useRef<THREE.Group | null>(null);
  const lineRef = useRef<THREE.Line | null>(null);
  const lineMaterialRef = useRef<THREE.LineBasicMaterial | null>(null);
  const bobberRef = useRef<THREE.Mesh | null>(null);
  const bobberMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const waterMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const markersRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const fishSchoolRef = useRef<THREE.Group | null>(null);
  const seagullsRef = useRef<THREE.Group | null>(null);

  // Overlay Animation State
  const [visualCatch, setVisualCatch] = useState<{ x: number; y: number; fish: FishType } | null>(null);

  // Input state
  const keys = useRef<{ [key: string]: boolean }>({});

  // Trigger visual catch effect when caughtFish updates
  useEffect(() => {
    if (caughtFish && bobberRef.current && cameraRef.current && mountRef.current) {
      // 1. Get Bobber World Position
      const bobberPos = new THREE.Vector3();
      bobberRef.current.getWorldPosition(bobberPos);

      // 2. Project to 2D Screen Space
      bobberPos.project(cameraRef.current);

      const x = (bobberPos.x * 0.5 + 0.5) * mountRef.current.clientWidth;
      const y = (-(bobberPos.y * 0.5) + 0.5) * mountRef.current.clientHeight;

      setVisualCatch({ x, y, fish: caughtFish });

      // 3. Clear after animation
      const timer = setTimeout(() => {
        setVisualCatch(null);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [caughtFish]);

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 20, 80); 

    // Camera
    const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 150);
    camera.position.set(0, 8 + (dockLevel * 1), 12 + (dockLevel * 1.5));
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
    mountRef.current.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x080820, 0.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    const shadowSize = 30 + (dockLevel * 2);
    dirLight.shadow.camera.left = -shadowSize;
    dirLight.shadow.camera.right = shadowSize;
    dirLight.shadow.camera.top = shadowSize;
    dirLight.shadow.camera.bottom = -shadowSize;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xffaa00, 0.3);
    rimLight.position.set(-5, 5, -10);
    scene.add(rimLight);

    // --- ENVIRONMENT ---
    const envGroup = new THREE.Group();
    scene.add(envGroup);

    const landMaterial = new THREE.MeshStandardMaterial({ color: 0x4a6741, roughness: 0.9, flatShading: true });
    const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x6c757d, roughness: 0.8, flatShading: true });
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 1 });
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2d4c1e, roughness: 0.8, flatShading: true });

    const createTree = (x: number, y: number, z: number, scale: number = 1) => {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(x, y, z);
        treeGroup.scale.setScalar(scale);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6), trunkMaterial);
        trunk.position.y = 0.75;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        treeGroup.add(trunk);
        const l1 = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2, 6), foliageMaterial);
        l1.position.y = 2;
        l1.castShadow = true;
        l1.receiveShadow = true;
        treeGroup.add(l1);
        const l2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.5, 6), foliageMaterial);
        l2.position.y = 3.2;
        l2.castShadow = true;
        l2.receiveShadow = true;
        treeGroup.add(l2);
        return treeGroup;
    };

    const createRock = (x: number, y: number, z: number, scale: number = 1) => {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), rockMaterial);
        rock.position.set(x, y, z);
        rock.scale.set(scale, scale * 0.7, scale);
        rock.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
        rock.castShadow = true;
        rock.receiveShadow = true;
        return rock;
    };

    const hill1 = new THREE.Mesh(new THREE.ConeGeometry(25, 15, 7), landMaterial);
    hill1.position.set(-20, -3, -40);
    hill1.scale.set(2, 1, 1.5);
    hill1.receiveShadow = true;
    envGroup.add(hill1);

    const hill2 = new THREE.Mesh(new THREE.ConeGeometry(20, 12, 6), landMaterial);
    hill2.position.set(25, -3, -35);
    hill2.scale.set(1.8, 1, 1.5);
    hill2.receiveShadow = true;
    envGroup.add(hill2);

    const hill3 = new THREE.Mesh(new THREE.ConeGeometry(30, 18, 8), landMaterial);
    hill3.position.set(0, -5, -60);
    hill3.scale.set(2.5, 1, 1);
    hill3.receiveShadow = true;
    envGroup.add(hill3);

    envGroup.add(createTree(-15, 0, -30, 1.2));
    envGroup.add(createTree(-22, 1, -35, 1.5));
    envGroup.add(createTree(-10, -1, -32, 1.0));
    envGroup.add(createTree(-28, -1, -38, 1.3));
    envGroup.add(createTree(18, 0, -28, 1.4));
    envGroup.add(createTree(25, 1.5, -32, 1.1));
    envGroup.add(createTree(12, -1, -30, 0.9));
    envGroup.add(createTree(30, 0, -35, 1.6));

    for(let i=0; i<8; i++) {
        const tx = (Math.random() - 0.5) * 40;
        const tz = -45 - Math.random() * 10;
        envGroup.add(createTree(tx, -1, tz, 2.0 + Math.random()));
    }

    envGroup.add(createRock(-8, -1.2, -15, 1.5));
    envGroup.add(createRock(-9, -1.5, -14, 1.0));
    envGroup.add(createRock(10, -1.2, -12, 2.0));
    envGroup.add(createRock(12, -1.5, -13, 1.2));

    // --- WATER ---
    const depthFactor = Math.min((depthLevel - 1) / 10, 1);
    const surfaceColor = new THREE.Color('#60a5fa').lerp(new THREE.Color('#1e3a8a'), depthFactor * 0.8);
    const depthColor = new THREE.Color('#1e40af').lerp(new THREE.Color('#020617'), depthFactor);
    const opacity = 0.75 + (depthFactor * 0.15);

    const waterGeometry = new THREE.PlaneGeometry(120, 120, 128, 128);
    const waterMaterial = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uDepthColor: { value: depthColor },
        uSurfaceColor: { value: surfaceColor },
        uFoamColor: { value: new THREE.Color('#ffffff') },
        uOpacity: { value: opacity },
      },
      transparent: true,
      side: THREE.DoubleSide
    });
    waterMaterialRef.current = waterMaterial;

    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -1;
    scene.add(water);

    // Decorative Fish School
    const fishSchoolGroup = new THREE.Group();
    fishSchoolRef.current = fishSchoolGroup;
    scene.add(fishSchoolGroup);

    const fishGeo = new THREE.ConeGeometry(0.1, 0.4, 8);
    fishGeo.rotateX(-Math.PI / 2);
    
    // Instantiate random fish with varied behaviors
    for (let i = 0; i < 30; i++) {
        const fishMat = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color().setHSL(0.5 + Math.random() * 0.2, 0.8, 0.6),
            roughness: 0.3,
            metalness: 0.2
        });
        const fish = new THREE.Mesh(fishGeo, fishMat);
        
        // Define varied motion types
        // Type 0: Idling (Small circles)
        // Type 1: Patrolling (Larger ellipses/lines)
        const motionType = Math.random();
        let radiusX, radiusZ, speed, wobble;
        
        if (motionType < 0.4) {
            // Idling
            const r = 0.5 + Math.random() * 1.5;
            radiusX = r;
            radiusZ = r;
            speed = 0.05 + Math.random() * 0.1; // Very slow
            wobble = 2 + Math.random() * 2;
        } else {
            // Patrolling
            const isElongated = Math.random() > 0.6; // Chance for line-like swim
            const baseR = 3 + Math.random() * 4;
            radiusX = baseR;
            radiusZ = isElongated ? baseR * 0.2 : baseR * 0.7; // Ellipse or Broad Circle
            speed = 0.2 + Math.random() * 0.3; // Moderate speed
            wobble = 5 + Math.random() * 5;
        }
        
        fish.userData = {
            center: new THREE.Vector2((Math.random() - 0.5) * 35, (Math.random() - 0.5) * 30),
            radiusX: radiusX,
            radiusZ: radiusZ,
            pathRotation: Math.random() * Math.PI * 2,
            speed: speed,
            phase: Math.random() * Math.PI * 2,
            yBase: -1.0 - Math.random() * 3.0, // Depth
            direction: Math.random() > 0.5 ? 1 : -1,
            wobbleSpeed: wobble
        };
        
        fishSchoolGroup.add(fish);
    }
    
    // --- ANIMATED SEAGULLS ---
    const seagullsGroup = new THREE.Group();
    seagullsRef.current = seagullsGroup;
    scene.add(seagullsGroup);

    const createSeagull = () => {
        const bird = new THREE.Group();
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        body.rotation.x = Math.PI / 2;
        bird.add(body);
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.2, 4), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
        beak.rotation.x = Math.PI / 2;
        beak.position.z = 0.3;
        bird.add(beak);
        const leftWing = new THREE.Group();
        const rightWing = new THREE.Group();
        const wGeo = new THREE.BoxGeometry(0.8, 0.02, 0.25);
        wGeo.translate(0.4, 0, 0);
        const lMesh = new THREE.Mesh(wGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
        const rMesh = new THREE.Mesh(wGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
        leftWing.add(lMesh);
        rMesh.scale.x = -1;
        rightWing.add(rMesh);
        bird.add(leftWing);
        bird.add(rightWing);
        return { bird, leftWing, rightWing };
    };

    for(let i=0; i<5; i++) {
        const { bird, leftWing, rightWing } = createSeagull();
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40 - 10;
        const y = 10 + Math.random() * 5;
        bird.position.set(x, y, z);
        
        bird.userData = {
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.1).normalize().multiplyScalar(0.15),
            state: 'cruising',
            wingSpeed: 10 + Math.random() * 5,
            leftWing,
            rightWing,
            glideTime: 0,
            target: new THREE.Vector3()
        };
        seagullsGroup.add(bird);
    }

    // Dock
    const dockWidth = 8 + (dockLevel - 1) * 4;
    const dockDepth = 6 + (dockLevel - 1) * 2;
    const dockGeometry = new THREE.BoxGeometry(dockWidth, 0.5, dockDepth);
    const dockMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9, metalness: 0.1 });
    const dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.y = -0.25;
    dock.receiveShadow = true;
    dock.castShadow = true;
    scene.add(dock);

    // Markers
    const markersGroup = new THREE.Group();
    scene.add(markersGroup);
    markersRef.current = markersGroup;
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 2);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x5c2e0b });
    const cornerX = (dockWidth / 2) - 0.2;
    const cornerZ = (dockDepth / 2) - 0.2;
    [[-cornerX, -cornerZ], [cornerX, -cornerZ], [-cornerX, cornerZ], [cornerX, cornerZ]].forEach(([x, z]) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 0.5, z);
      post.castShadow = true;
      post.receiveShadow = true;
      scene.add(post);
      const cluster = new THREE.Group();
      cluster.position.set(x, 1.8, z);
      markersGroup.add(cluster);
      const ringGeo = new THREE.TorusGeometry(0.25, 0.03, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      cluster.add(ring);
      const innerRingGeo = new THREE.TorusGeometry(0.15, 0.02, 8, 16);
      const innerRingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
      const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
      innerRing.rotation.x = Math.PI / 2;
      cluster.add(innerRing);
      const light = new THREE.PointLight(0x4ade80, 0.5, 3);
      cluster.add(light);
    });

    // --- PLAYER ---
    const playerGroup = new THREE.Group();
    playerRef.current = playerGroup;
    scene.add(playerGroup);

    // 1. Legs (Waders)
    const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.65, 8);
    const waderMat = new THREE.MeshStandardMaterial({ 
        color: 0x2c3e50, // Dark Blue/Grey Waders
        roughness: 0.6 
    });
    
    const leftLeg = new THREE.Mesh(legGeo, waderMat);
    leftLeg.position.set(-0.15, 0.325, 0);
    leftLeg.castShadow = true;
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, waderMat);
    rightLeg.position.set(0.15, 0.325, 0);
    rightLeg.castShadow = true;
    playerGroup.add(rightLeg);

    // Boots
    const bootGeo = new THREE.BoxGeometry(0.14, 0.15, 0.25);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }); // Black boots
    
    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.15, 0.075, 0.05);
    leftBoot.castShadow = true;
    playerGroup.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.15, 0.075, 0.05);
    rightBoot.castShadow = true;
    playerGroup.add(rightBoot);

    // 2. Torso (Shirt + Vest)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.65;
    playerGroup.add(torsoGroup);

    // Shirt
    const shirtGeo = new THREE.BoxGeometry(0.45, 0.55, 0.25);
    const shirtMat = new THREE.MeshStandardMaterial({ 
        color: isVip ? 0xfcd34d : 0xcc4444, // Gold if VIP, Red plaid if not
        roughness: 1.0
    });
    const shirt = new THREE.Mesh(shirtGeo, shirtMat);
    shirt.position.y = 0.275;
    shirt.castShadow = true;
    shirt.receiveShadow = true;
    torsoGroup.add(shirt);

    // Vest (Fishing Vest) with pockets
    const vestGeo = new THREE.BoxGeometry(0.5, 0.35, 0.3);
    const vestMat = new THREE.MeshStandardMaterial({ 
        color: isVip ? 0xffd700 : 0x78716c, // Gold metallic if VIP, Khaki/Stone if not
        roughness: 0.8,
        metalness: isVip ? 0.3 : 0
    });
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.y = 0.3;
    vest.castShadow = true;
    torsoGroup.add(vest);
    
    // Vest Pocket 1
    const pocketGeo = new THREE.BoxGeometry(0.15, 0.12, 0.05);
    const pocket1 = new THREE.Mesh(pocketGeo, vestMat);
    pocket1.position.set(-0.15, 0.25, 0.15);
    torsoGroup.add(pocket1);

    // Vest Pocket 2
    const pocket2 = new THREE.Mesh(pocketGeo, vestMat);
    pocket2.position.set(0.15, 0.25, 0.15);
    torsoGroup.add(pocket2);

    // 3. Head
    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffccaa }); // Skin
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.35;
    head.castShadow = true;
    playerGroup.add(head);

    // 4. Hat (Bucket Hat)
    const hatGroup = new THREE.Group();
    hatGroup.position.y = 1.45;
    playerGroup.add(hatGroup);

    const hatColor = isVip ? 0xffd700 : 0x57534e; // Gold or Dark Grey

    // Brim
    const brimGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16);
    const hatMat = new THREE.MeshStandardMaterial({ 
        color: hatColor,
        roughness: 1.0,
        side: THREE.DoubleSide
    });
    const brim = new THREE.Mesh(brimGeo, hatMat);
    hatGroup.add(brim);

    // Top
    const topGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.18, 16);
    const top = new THREE.Mesh(topGeo, hatMat);
    top.position.y = 0.11;
    hatGroup.add(top);

    // 5. Backpack
    const packGeo = new THREE.BoxGeometry(0.35, 0.4, 0.15);
    const packMat = new THREE.MeshStandardMaterial({ color: 0x3f2e18 }); // Leather brown
    const backpack = new THREE.Mesh(packGeo, packMat);
    backpack.position.set(0, 0.95, -0.2); // On back
    backpack.castShadow = true;
    playerGroup.add(backpack);

    // Arms 
    // Left Arm (Idle)
    const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8);
    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.set(-0.28, 1.05, 0); // Shoulder height
    leftArm.rotation.z = 0.3; // Flared out slightly
    leftArm.castShadow = true;
    playerGroup.add(leftArm);

    // Right Arm (Holding Rod) 
    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.set(0.28, 1.05, 0);
    rightArm.rotation.z = -0.3;
    rightArm.rotation.x = -0.5; // Reaching forward slightly
    rightArm.castShadow = true;
    playerGroup.add(rightArm);

    // --- FISHING ROD ---
    const rodGroup = new THREE.Group();
    // Adjusted position to match the new right hand position roughly
    rodGroup.position.set(0.3, 1.0, 0.2); 
    playerGroup.add(rodGroup);
    rodRef.current = rodGroup;

    // Rod Handle (slightly thicker and detailed)
    const rodHandleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5);
    const rodHandleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
    const rodMesh = new THREE.Mesh(rodHandleGeo, rodHandleMat);
    rodMesh.rotation.x = Math.PI / 4; // Angled forward
    rodMesh.position.z = 1; 
    rodMesh.position.y = 1;
    rodMesh.castShadow = true;
    rodGroup.add(rodMesh);
    
    // Reel
    const reelGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12);
    const reelMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.5 });
    const reel = new THREE.Mesh(reelGeo, reelMat);
    reel.rotation.z = Math.PI / 2;
    // Position reel on the rod
    reel.position.set(0, -0.5, 0.08); // Offset from center of rod handle
    rodMesh.add(reel);

    const bobberGeo = new THREE.SphereGeometry(0.1, 8, 8);
    const bobberMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.1, emissive: 0x000000 });
    bobberMaterialRef.current = bobberMat;
    const bobber = new THREE.Mesh(bobberGeo, bobberMat);
    bobber.visible = false;
    bobber.castShadow = true;
    scene.add(bobber);
    bobberRef.current = bobber;

    const segmentCount = 30;
    const linePoints = new Float32Array(segmentCount * 3);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePoints, 3));
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    lineMaterialRef.current = lineMaterial;
    const fishingLine = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(fishingLine);
    lineRef.current = fishingLine;

    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- ANIMATION LOOP ---
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);
      time += 0.05;

      if (waterMaterialRef.current) {
        waterMaterialRef.current.uniforms.uTime.value = time;
      }

      if (markersRef.current) {
         markersRef.current.children.forEach((cluster, i) => {
             if (cluster instanceof THREE.Group) {
                 cluster.position.y = 1.8 + Math.sin(time * 2 + i) * 0.1;
                 const outerRing = cluster.children[0];
                 const innerRing = cluster.children[1];
                 const light = cluster.children[2];
                 if (outerRing) {
                    outerRing.rotation.z += 0.02;
                    const scale = 1 + Math.sin(time * 3) * 0.1;
                    outerRing.scale.setScalar(scale);
                 }
                 if (innerRing) {
                    innerRing.rotation.z -= 0.05;
                 }
                 if (light instanceof THREE.PointLight) {
                    light.intensity = 0.5 + Math.sin(time * 4) * 0.3;
                 }
             }
         });
      }

      // Animate Fish School
      if (fishSchoolRef.current) {
          const bobberPos = bobberRef.current && bobberRef.current.visible ? bobberRef.current.position : null;

          fishSchoolRef.current.children.forEach((fish) => {
             const u = fish.userData;
             const t = time * u.speed * 0.5; 
             
             // Circular/Elliptical motion logic
             const angle = u.phase + (t * u.direction);
             const localX = Math.cos(angle) * u.radiusX;
             const localZ = Math.sin(angle) * u.radiusZ;

             const rotX = localX * Math.cos(u.pathRotation) - localZ * Math.sin(u.pathRotation);
             const rotZ = localX * Math.sin(u.pathRotation) + localZ * Math.cos(u.pathRotation);

             let x = u.center.x + rotX;
             let z = u.center.y + rotZ;
             
             // Orientation derivative
             const dLocalX = -Math.sin(angle) * u.radiusX * u.direction;
             const dLocalZ = Math.cos(angle) * u.radiusZ * u.direction;
             const dRotX = dLocalX * Math.cos(u.pathRotation) - dLocalZ * Math.sin(u.pathRotation);
             const dRotZ = dLocalX * Math.sin(u.pathRotation) + dLocalZ * Math.cos(u.pathRotation);
             
             let lookDx = dRotX;
             let lookDz = dRotZ;

             // Gentle vertical wave
             let y = u.yBase + Math.sin(t * 2) * 0.1;
             
             let isScattering = false;
             let scatterFactor = 0; 
             let scatterDirX = 0;
             let scatterDirZ = 0;

             // SCATTER LOGIC
             if (bobberPos) {
                 const dx = x - bobberPos.x;
                 const dz = z - bobberPos.z;
                 const distSq = dx*dx + dz*dz;
                 const threshold = 3.5; 
                 
                 if (distSq < threshold * threshold) {
                     isScattering = true;
                     const dist = Math.sqrt(distSq);
                     const safeDist = dist < 0.001 ? 0.001 : dist;
                     scatterFactor = (threshold - safeDist) / threshold; 
                     const pushFactor = 5.0 * scatterFactor;
                     const dirX = dx / safeDist;
                     const dirZ = dz / safeDist;
                     
                     x += dirX * pushFactor;
                     z += dirZ * pushFactor;
                     y -= scatterFactor * 1.5; 
                     scatterDirX = dirX;
                     scatterDirZ = dirZ;
                 }
             }
             
             const wiggle = Math.sin(time * u.wobbleSpeed) * 0.1;
             fish.position.set(x, y, z);
             
             if (isScattering) {
                 lookDx = lookDx * 0.3 + scatterDirX * 0.7;
                 lookDz = lookDz * 0.3 + scatterDirZ * 0.7;
             }
             fish.rotation.y = Math.atan2(lookDx, lookDz) + wiggle; 
             const diveAngle = isScattering ? -0.8 * scatterFactor : 0;
             fish.rotation.x = (Math.cos(t * 2) * 0.1 * u.direction) - (Math.PI / 2) + diveAngle;
          });
      }

      // Animate Seagulls
      if (seagullsRef.current) {
        seagullsRef.current.children.forEach((bird) => {
            const u = bird.userData;
            if (u.state === 'cruising') {
                u.velocity.x += (Math.random() - 0.5) * 0.01;
                u.velocity.z += (Math.random() - 0.5) * 0.01;
                u.velocity.clampLength(0.1, 0.2);
                bird.position.add(u.velocity);
                const targetLook = bird.position.clone().add(u.velocity);
                bird.lookAt(targetLook);
                
                if (Math.random() < 0.01) u.glideTime = 60;
                if (u.glideTime > 0) {
                    u.glideTime--;
                    u.leftWing.rotation.z = THREE.MathUtils.lerp(u.leftWing.rotation.z, 0, 0.1);
                    u.rightWing.rotation.z = THREE.MathUtils.lerp(u.rightWing.rotation.z, 0, 0.1);
                } else {
                    const flap = Math.sin(time * u.wingSpeed) * 0.3;
                    u.leftWing.rotation.z = flap;
                    u.rightWing.rotation.z = -flap;
                }

                if (bird.position.length() > 50) {
                    const centerDir = new THREE.Vector3(0, bird.position.y, 0).sub(bird.position).normalize().multiplyScalar(0.15);
                    u.velocity.lerp(centerDir, 0.05); 
                }
                if (Math.random() < 0.002) {
                    u.state = 'diving';
                    u.target = new THREE.Vector3((Math.random() - 0.5) * 10, -0.5, (Math.random() - 0.5) * 10);
                    u.glideTime = 0; 
                }
            } else if (u.state === 'diving') {
                const direction = new THREE.Vector3().subVectors(u.target, bird.position).normalize();
                bird.position.add(direction.multiplyScalar(0.4));
                bird.lookAt(u.target);
                u.leftWing.rotation.z = 0.5;
                u.rightWing.rotation.z = -0.5;
                if (bird.position.y < 1.0) {
                    u.state = 'recovering';
                    const forward = new THREE.Vector3(u.velocity.x, 0, u.velocity.z).normalize();
                    if (forward.length() === 0) forward.set(1,0,0);
                    u.target = bird.position.clone().add(forward.multiplyScalar(20)).setY(12 + Math.random() * 5);
                }
            } else if (u.state === 'recovering') {
                const direction = new THREE.Vector3().subVectors(u.target, bird.position).normalize();
                bird.position.add(direction.multiplyScalar(0.25));
                bird.lookAt(u.target); 
                const flap = Math.sin(time * u.wingSpeed * 1.5) * 0.5; 
                u.leftWing.rotation.z = flap;
                u.rightWing.rotation.z = -flap;
                if (bird.position.y >= u.target.y - 1) {
                    u.state = 'cruising';
                    const heading = new THREE.Vector3().subVectors(u.target, bird.position).normalize();
                    heading.y = 0; 
                    u.velocity = heading.multiplyScalar(0.15);
                }
            }
        });
      }

      // Movement Logic
      const speed = 0.1;
      const boundsX = (dockWidth / 2) - 0.5;
      const boundsZ = (dockDepth / 2) - 0.5;
      let moving = false;

      if (keys.current['KeyW'] || keys.current['ArrowUp']) {
        if (playerGroup.position.z > -boundsZ) playerGroup.position.z -= speed;
        playerGroup.rotation.y = Math.PI; 
        moving = true;
      }
      if (keys.current['KeyS'] || keys.current['ArrowDown']) {
        if (playerGroup.position.z < boundsZ) playerGroup.position.z += speed;
        playerGroup.rotation.y = 0; 
        moving = true;
      }
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) {
        if (playerGroup.position.x > -boundsX) playerGroup.position.x -= speed;
        playerGroup.rotation.y = -Math.PI / 2;
        moving = true;
      }
      if (keys.current['KeyD'] || keys.current['ArrowRight']) {
        if (playerGroup.position.x < boundsX) playerGroup.position.x += speed;
        playerGroup.rotation.y = Math.PI / 2;
        moving = true;
      }

      if (moving) {
        playerGroup.position.y = Math.sin(time * 4) * 0.05;
      } else {
        playerGroup.position.y = 0;
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isVip, dockLevel, depthLevel]);

  // --- STATUS ANIMATION EFFECT ---
  useEffect(() => {
    if (!rodRef.current || !playerRef.current) return;

    // Reset rod
    rodRef.current.rotation.x = 0;
    
    // Capture start time to ensure deterministic animation phases
    const startTime = Date.now();

    const animateStatus = () => {
        const now = Date.now();
        const elapsed = now - startTime;

        if (status === 'casting') {
            // 3-phase casting animation (Wind-up -> Throw -> Settle)
            if (elapsed < 300) {
                // Phase 1: Wind up (Pull back)
                const t = elapsed / 300;
                // Smooth ease-out back to -0.6 radians
                rodRef.current!.rotation.x = -0.6 * Math.sin(t * Math.PI / 2);
            } else if (elapsed < 600) {
                // Phase 2: The Cast (Whip forward)
                const t = (elapsed - 300) / 300;
                // Accelerate forward from -0.6 to 1.2
                rodRef.current!.rotation.x = -0.6 + (1.8 * Math.pow(t, 2)); 
            } else {
                // Phase 3: Settle (Dampen to waiting position)
                const t = Math.min(1, (elapsed - 600) / 400);
                const startAngle = 1.2;
                const endAngle = Math.PI / 4; // ~0.785
                // Elastic bounce effect
                const bounce = Math.sin(t * Math.PI * 2) * 0.1 * (1 - t);
                rodRef.current!.rotation.x = startAngle - (startAngle - endAngle) * t + bounce;
            }
        } else if (status === 'waiting' || status === 'bited' || status === 'reeling') {
            
            // ROD ROTATION
            if (status === 'reeling') {
                // Pull rod up/back (smaller angle) and oscillate rapidly to simulate winding
                rodRef.current!.rotation.x = (Math.PI / 6) + Math.sin(now * 0.03) * 0.1;
            } else if (status === 'bited') {
                // Shake violently
                rodRef.current!.rotation.x = (Math.PI / 4) + Math.sin(now * 0.05) * 0.2;
            } else {
                // Waiting/Steady
                rodRef.current!.rotation.x = Math.PI / 4;
            }
            
            // Calculate world position of rod tip approx
            const pPos = playerRef.current!.position;
            
            // Update Line
            if (lineRef.current) {
                const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
                
                // Rod Tip Calculation
                const rodTipX = pPos.x + (Math.sin(playerRef.current!.rotation.y) * 1.5);
                const rodTipY = 2; // Approx rod tip height
                const rodTipZ = pPos.z + (Math.cos(playerRef.current!.rotation.y) * 1.5);

                // End at bobber in water
                // We'll cast "forward" from player
                let castDist = 5;

                // REELING LOGIC: Reduce distance over time
                if (status === 'reeling') {
                    // Assuming roughly 1000ms duration based on FishingGame.tsx
                    const duration = 1000;
                    const progress = Math.min(1, elapsed / duration);
                    // Ease out cubic for satisfying snap at end
                    const ease = 1 - Math.pow(1 - progress, 3);
                    castDist = 5 * (1 - ease);
                    if (castDist < 1) castDist = 1; // Don't clip into player
                }

                let bobX = pPos.x + (Math.sin(playerRef.current!.rotation.y) * castDist);
                let bobZ = pPos.z + (Math.cos(playerRef.current!.rotation.y) * castDist);
                
                // Bobber Y Calculation matching Shader Logic
                // Note: uTime increment is 0.05 per frame. 
                // Frame rate approx 60fps => t increases by 3.0 per second.
                // JS Date.now() is ms. t = (Date.now() / 1000) * 3 matches shader time scale roughly.
                const t = (Date.now() / 1000) * 3; 
                
                // Must match Shader Sum-of-Sines exactly
                let waveHeight = 0;
                
                // Layer 1
                waveHeight += Math.sin(bobX * 0.3 + t * 0.6) * 0.4;
                waveHeight += Math.sin(bobZ * 0.25 + t * 0.5) * 0.4;
                
                // Layer 2
                waveHeight += Math.sin((bobX + bobZ) * 0.8 + t * 0.9) * 0.15;
                waveHeight -= Math.cos((bobX - bobZ) * 0.8 + t * 0.7) * 0.15;

                // Layer 3
                waveHeight += Math.sin(bobX * 3.5 - t * 2.0) * 0.05;
                waveHeight += Math.cos(bobZ * 3.0 + t * 1.8) * 0.05;
                
                let bobY = waveHeight - 1; // Base water level is -1
                
                // Bobber effects
                if (status === 'waiting') {
                    // Gentle, rhythmic float
                    bobY += Math.sin(now * 0.002) * 0.02; 
                    
                    if (bobberMaterialRef.current) {
                        bobberMaterialRef.current.color.setHex(0xff0000);
                        bobberMaterialRef.current.emissive.setHex(0x110000); // Slight glow
                        if (bobberRef.current) bobberRef.current.scale.setScalar(1);
                    }
                } else if (status === 'bited') {
                    // Violent shaking
                    const violentTime = now * 0.03;
                    
                    // Sudden "pulls" downwards
                    const pull = Math.sin(violentTime) > 0.8 ? -0.3 : 0;
                    bobY += pull + Math.sin(violentTime * 2) * 0.1 + (Math.random() - 0.5) * 0.1;
                    
                    // Erratic horizontal movement
                    bobX += (Math.random() - 0.5) * 0.2;
                    bobZ += (Math.random() - 0.5) * 0.2;
                    
                    if (bobberMaterialRef.current) {
                        // Urgent flashing
                        const flash = Math.floor(now / 80) % 2 === 0;
                        bobberMaterialRef.current.color.setHex(flash ? 0xffff00 : 0xff0000); 
                        bobberMaterialRef.current.emissive.setHex(flash ? 0x888800 : 0x550000);
                        // Pulse size
                        if (bobberRef.current) bobberRef.current.scale.setScalar(flash ? 1.2 : 0.9);
                    }
                } else if (status === 'reeling') {
                    // Skimming effect - lift slightly due to tension
                    bobY += 0.15;
                    // Skip/Bounce on surface
                    bobY += Math.abs(Math.sin(now * 0.02)) * 0.1;

                    if (bobberMaterialRef.current) {
                        bobberMaterialRef.current.color.setHex(0xff4400); // Hotter color due to friction/speed
                        bobberMaterialRef.current.emissive.setHex(0x331100);
                        if (bobberRef.current) bobberRef.current.scale.setScalar(1);
                    }
                } else {
                    if (bobberMaterialRef.current) {
                        bobberMaterialRef.current.color.setHex(0xff0000);
                        bobberMaterialRef.current.emissive.setHex(0x000000);
                        if (bobberRef.current) bobberRef.current.scale.setScalar(1);
                    }
                }
                
                // --- PHYSICS LINE UPDATE ---
                const totalSegments = positions.length / 3;
                
                // Physics params
                let slack = -1.5; // Default droop
                let vibrationAmp = 0;
                let vibrationFreq = 0;

                if (status === 'waiting') {
                    slack = -1.5;
                    vibrationAmp = 0.02;
                    vibrationFreq = 2;
                } else if (status === 'bited') {
                    slack = -0.3; // Tighter
                    vibrationAmp = 0.1; 
                    vibrationFreq = 15;
                } else if (status === 'reeling') {
                    slack = 0; // Taut
                    vibrationAmp = 0.08; 
                    vibrationFreq = 30; // High freq buzz
                }

                for (let i = 0; i < totalSegments; i++) {
                    const tLine = i / (totalSegments - 1); // 0 to 1
                    
                    // Linear pos
                    const x = rodTipX + (bobX - rodTipX) * tLine;
                    const yLinear = rodTipY + (bobY - rodTipY) * tLine;
                    const z = rodTipZ + (bobZ - rodTipZ) * tLine;

                    // Parabolic slack
                    const sag = slack * Math.sin(tLine * Math.PI);
                    
                    // Harmonic Vibration
                    const vibe = Math.sin(tLine * Math.PI) * Math.sin(now * 0.01 * vibrationFreq) * vibrationAmp;

                    positions[i * 3] = x;
                    positions[i * 3 + 1] = yLinear + sag + vibe;
                    positions[i * 3 + 2] = z;
                }

                lineRef.current.geometry.attributes.position.needsUpdate = true;
                
                // Material Effects (Shimmering)
                if (status === 'reeling' && lineMaterialRef.current) {
                    // Flash / Shimmer
                    lineMaterialRef.current.opacity = 0.6 + Math.sin(now * 0.05) * 0.3;
                    lineMaterialRef.current.color.setHSL(0.6, 0.8, 0.9); // Bluish-white hot
                } else if (lineMaterialRef.current) {
                    lineMaterialRef.current.opacity = 0.5;
                    lineMaterialRef.current.color.setHex(0xffffff);
                }

                if (bobberRef.current) {
                    bobberRef.current.visible = true;
                    bobberRef.current.position.set(bobX, bobY, bobZ);
                }
            }
        } else {
            // Hide line and bobber
            if (lineRef.current) {
                const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
                positions.fill(0);
                lineRef.current.geometry.attributes.position.needsUpdate = true;
            }
            if (bobberRef.current) bobberRef.current.visible = false;
        }
        
        requestAnimationFrame(animateStatus);
    };
    
    const animId = requestAnimationFrame(animateStatus);
    return () => cancelAnimationFrame(animId);
  }, [status]);

  return (
    <div className="w-full h-full relative group">
       <div ref={mountRef} className="w-full h-full rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-sky-300" />
       
       {/* Instruction Overlay */}
       <div className="absolute top-2 left-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-[10px] px-2 py-1 rounded">
          WASD / Arrows to Move
       </div>

       {/* Floating Fish Animation Overlay */}
       {visualCatch && (
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
          <span className={`text-sm font-bold bg-black/50 backdrop-blur px-2 py-1 rounded text-white whitespace-nowrap`}>
            {visualCatch.fish.name}
          </span>
        </div>
       )}
    </div>
  );
};