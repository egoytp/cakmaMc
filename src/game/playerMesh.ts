import * as THREE from 'three';
import { BlockType, getTextureAtlas } from './textures';

export interface RemotePlayerData {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  isMoving: boolean;
  isSprinting: boolean;
  heldItem: number;
}

export class PlayerMesh {
  group: THREE.Group;
  headGroup: THREE.Group;
  headMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  heldItemMesh: THREE.Mesh | null = null;
  nameTag: THREE.Sprite;
  beaconMesh: THREE.Mesh;

  targetPos = new THREE.Vector3();
  targetYaw = 0;
  targetPitch = 0;
  walkCycle = 0;
  isMoving = false;
  isSprinting = false;
  lastHeldItem = -1;

  constructor(scene: THREE.Scene, data: RemotePlayerData) {
    this.group = new THREE.Group();
    this.targetPos.set(data.x, data.y, data.z);
    this.group.position.copy(this.targetPos);

    // Player color palette based on their chosen skin color
    const baseColor = new THREE.Color(data.color || '#3b82f6');
    const skinColor = new THREE.Color('#e0ac69'); // classic Steve skin tone
    const pantsColor = new THREE.Color('#1e3a8a'); // classic blue pants
    const shoeColor = new THREE.Color('#333333');

    const shirtMat = new THREE.MeshLambertMaterial({ color: baseColor });
    const skinMat = new THREE.MeshLambertMaterial({ color: skinColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: pantsColor });
    const shoeMat = new THREE.MeshLambertMaterial({ color: shoeColor });

    // 1. Head Group (head can rotate pitch and yaw independently)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.45, 0);

    // Head Box (0.42 x 0.42 x 0.42)
    const headGeom = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    this.headMesh = new THREE.Mesh(headGeom, skinMat);
    this.headMesh.position.set(0, 0.21, 0);
    this.headMesh.castShadow = true;
    this.headGroup.add(this.headMesh);

    // Hair accent on head
    const hairGeom = new THREE.BoxGeometry(0.44, 0.16, 0.44);
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
    const hairMesh = new THREE.Mesh(hairGeom, hairMat);
    hairMesh.position.set(0, 0.35, 0);
    this.headGroup.add(hairMesh);

    // Eyes accent
    const eyeGeom = new THREE.BoxGeometry(0.08, 0.05, 0.02);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1d4ed8 });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.1, 0.21, 0.22);
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.1, 0.21, 0.22);
    this.headGroup.add(leftEye, rightEye);

    this.group.add(this.headGroup);

    // 2. Torso (0.44 wide, 0.62 tall, 0.22 deep)
    const bodyGeom = new THREE.BoxGeometry(0.44, 0.62, 0.22);
    this.bodyMesh = new THREE.Mesh(bodyGeom, shirtMat);
    this.bodyMesh.position.set(0, 1.14, 0);
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // 3. Left Arm (0.19 wide, 0.62 tall, 0.19 deep)
    const armGeom = new THREE.BoxGeometry(0.19, 0.62, 0.19);
    armGeom.translate(0, -0.31, 0); // pivot at shoulder
    this.leftArm = new THREE.Mesh(armGeom, shirtMat);
    this.leftArm.position.set(-0.32, 1.45, 0);
    this.leftArm.castShadow = true;
    this.group.add(this.leftArm);

    // 4. Right Arm (holds item)
    this.rightArm = new THREE.Mesh(armGeom, shirtMat);
    this.rightArm.position.set(0.32, 1.45, 0);
    this.rightArm.castShadow = true;
    this.group.add(this.rightArm);

    // 5. Left Leg (0.19 wide, 0.65 tall, 0.19 deep)
    const legGeom = new THREE.BoxGeometry(0.19, 0.65, 0.19);
    legGeom.translate(0, -0.325, 0); // pivot at hip
    this.leftLeg = new THREE.Mesh(legGeom, pantsMat);
    this.leftLeg.position.set(-0.11, 0.83, 0);
    this.leftLeg.castShadow = true;
    this.group.add(this.leftLeg);

    // 6. Right Leg
    this.rightLeg = new THREE.Mesh(legGeom, pantsMat);
    this.rightLeg.position.set(0.11, 0.83, 0);
    this.rightLeg.castShadow = true;
    this.group.add(this.rightLeg);

    // 7. Floating Nametag Sprite - ALWAYS rendered on top with depthTest: false & high renderOrder
    this.nameTag = this.createNameTagSprite(data.name, data.color);
    this.nameTag.position.set(0, 2.25, 0);
    this.nameTag.renderOrder = 99999;
    this.group.add(this.nameTag);

    // 8. Overhead Locator Beacon / Diamond Marker (Makes friend easy to spot from distance)
    const beaconGeom = new THREE.ConeGeometry(0.16, 0.32, 4);
    beaconGeom.rotateX(Math.PI); // point downwards to player head
    const beaconMat = new THREE.MeshBasicMaterial({
      color: data.color || '#38bdf8',
      depthTest: false,
      transparent: true,
      opacity: 0.9,
    });
    this.beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
    this.beaconMesh.position.set(0, 2.65, 0);
    this.beaconMesh.renderOrder = 99998;
    this.group.add(this.beaconMesh);

    // Update held item
    this.updateHeldItem(data.heldItem);

    scene.add(this.group);
  }

  private createNameTagSprite(name: string, colorHex: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 280;
    canvas.height = 70;
    const ctx = canvas.getContext('2d')!;

    // Rounded dark background badge
    ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
    ctx.strokeStyle = colorHex || '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(6, 10, 268, 50, 10);
    ctx.fill();
    ctx.stroke();

    // Player name text
    ctx.font = 'bold 24px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(name.slice(0, 16), 140, 35);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.5, 0.38, 1);
    return sprite;
  }

  updateHeldItem(itemType: number) {
    if (this.lastHeldItem === itemType) return;
    this.lastHeldItem = itemType;

    if (this.heldItemMesh) {
      this.rightArm.remove(this.heldItemMesh);
      this.heldItemMesh.geometry.dispose();
      this.heldItemMesh = null;
    }

    if (itemType > 0) {
      const atlas = getTextureAtlas();
      const geom = new THREE.BoxGeometry(0.24, 0.24, 0.24);
      const mat = atlas.getMaterial(itemType as BlockType);
      this.heldItemMesh = new THREE.Mesh(geom, mat);
      this.heldItemMesh.position.set(0, -0.48, 0.22);
      this.heldItemMesh.rotation.set(0.3, 0.2, 0);
      this.rightArm.add(this.heldItemMesh);
    }
  }

  updateTarget(data: Partial<RemotePlayerData>) {
    if (Number.isFinite(data.x) && Number.isFinite(data.y) && Number.isFinite(data.z)) {
      this.targetPos.set(data.x!, data.y!, data.z!);
      // Snap instantly if far away (teleport or initial join) so players don't glide through walls
      if (this.group.position.distanceTo(this.targetPos) > 6) {
        this.group.position.copy(this.targetPos);
      }
    }
    if (Number.isFinite(data.yaw)) this.targetYaw = data.yaw!;
    if (Number.isFinite(data.pitch)) this.targetPitch = data.pitch!;
    if (data.isMoving !== undefined) this.isMoving = Boolean(data.isMoving);
    if (data.isSprinting !== undefined) this.isSprinting = Boolean(data.isSprinting);
    if (data.heldItem !== undefined) this.updateHeldItem(data.heldItem);
  }

  tick(delta: number) {
    // Smooth position interpolation
    this.group.position.lerp(this.targetPos, Math.min(delta * 14, 1));

    // Smooth rotation
    this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, this.targetYaw, Math.min(delta * 15, 1));
    this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, this.targetPitch, Math.min(delta * 15, 1));

    // Spin overhead locator beacon
    this.beaconMesh.rotation.y += delta * 3.5;
    this.beaconMesh.position.y = 2.65 + Math.sin(Date.now() * 0.005) * 0.08;

    // Walking animation
    if (this.isMoving) {
      const speed = this.isSprinting ? 16 : 10;
      this.walkCycle += delta * speed;
      const angle = Math.sin(this.walkCycle) * 0.6;

      this.leftArm.rotation.x = angle;
      this.rightArm.rotation.x = -angle;
      this.leftLeg.rotation.x = -angle;
      this.rightLeg.rotation.x = angle;
    } else {
      // Return to resting position
      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, 0, 8, delta);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, 0, 8, delta);
      this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, 0, 8, delta);
      this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, 0, 8, delta);
    }
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.group);
  }
}
