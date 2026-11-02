import * as THREE from 'three';
import { VoxelWorld } from './voxelWorld';
import { BlockType, BLOCK_METAS } from './textures';

export interface PlayerInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  crouch: boolean;
}

export class PlayerPhysics {
  position = new THREE.Vector3();
  velocity = new THREE.Vector3();
  isOnGround = false;
  isInWater = false;
  isHeadInWater = false;
  highestFallY = 0;
  onFallDamage?: (damage: number) => void;

  // AABB dimensions
  width = 0.6;
  height = 1.8;
  eyeHeight = 1.62;

  // Constants
  gravity = -26.0;
  jumpForce = 8.6;
  walkSpeed = 4.8;
  sprintSpeed = 7.4;

  world: VoxelWorld;

  constructor(world: VoxelWorld, startX = 0, startY = 20, startZ = 0) {
    this.world = world;
    this.position.set(startX, startY, startZ);
    this.highestFallY = startY;
  }

  isSolid(x: number, y: number, z: number): boolean {
    const block = this.world.getBlock(x, y, z);
    if (block === BlockType.AIR) return false;
    const meta = BLOCK_METAS[block];
    if (meta && meta.isLiquid) return false;
    return true;
  }

  checkWater(): boolean {
    const minX = Math.floor(this.position.x - this.width / 2);
    const maxX = Math.floor(this.position.x + this.width / 2);
    const minY = Math.floor(this.position.y);
    const maxY = Math.floor(this.position.y + this.eyeHeight);
    const minZ = Math.floor(this.position.z - this.width / 2);
    const maxZ = Math.floor(this.position.z + this.width / 2);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.world.getBlock(x, y, z) === BlockType.WATER) {
            return true;
          }
        }
      }
    }
    return false;
  }

  checkHeadWater(): boolean {
    const bx = Math.floor(this.position.x);
    const by = Math.floor(this.position.y + this.eyeHeight);
    const bz = Math.floor(this.position.z);
    return this.world.getBlock(bx, by, bz) === BlockType.WATER;
  }

  update(delta: number, input: PlayerInput, yaw: number) {
    const dt = Math.min(delta, 0.05);

    const wasOnGround = this.isOnGround;
    this.isInWater = this.checkWater();
    this.isHeadInWater = this.checkHeadWater();

    if (this.isInWater) {
      this.highestFallY = this.position.y;
    } else if (this.position.y > this.highestFallY || wasOnGround) {
      this.highestFallY = this.position.y;
    }

    // Horizontal movement direction from input and yaw
    const forwardVec = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const rightVec = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    const moveDir = new THREE.Vector3();
    if (input.forward) moveDir.add(forwardVec);
    if (input.backward) moveDir.sub(forwardVec);
    if (input.right) moveDir.add(rightVec);
    if (input.left) moveDir.sub(rightVec);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
    }

    const currentSpeed = input.sprint ? this.sprintSpeed : this.walkSpeed;
    const targetVx = moveDir.x * (this.isInWater ? currentSpeed * 0.6 : currentSpeed);
    const targetVz = moveDir.z * (this.isInWater ? currentSpeed * 0.6 : currentSpeed);

    // Smooth horizontal acceleration
    const damping = this.isOnGround ? 16 : 4;
    this.velocity.x += (targetVx - this.velocity.x) * Math.min(damping * dt, 1);
    this.velocity.z += (targetVz - this.velocity.z) * Math.min(damping * dt, 1);

    // Vertical physics
    if (this.isInWater) {
      if (input.jump) {
        this.velocity.y = 3.2;
      } else {
        this.velocity.y = Math.max(this.velocity.y - 8 * dt, -2.5); // slow sinking
      }
    } else {
      // Normal gravity
      this.velocity.y += this.gravity * dt;
      if (this.isOnGround && input.jump) {
        this.velocity.y = this.jumpForce;
        this.isOnGround = false;
      }
    }

    // Step-by-step axis aligned collision resolution
    this.moveWithCollision(this.velocity.x * dt, this.velocity.y * dt, this.velocity.z * dt);
  }

  private moveWithCollision(dx: number, dy: number, dz: number) {
    const halfW = this.width / 2;

    // 1. Move on Y axis
    this.position.y += dy;
    this.isOnGround = false;

    // Check Y collisions
    const checkMinX = Math.floor(this.position.x - halfW);
    const checkMaxX = Math.floor(this.position.x + halfW);
    const checkMinZ = Math.floor(this.position.z - halfW);
    const checkMaxZ = Math.floor(this.position.z + halfW);

    if (dy < 0) {
      // Falling down
      const blockY = Math.floor(this.position.y);
      let collided = false;

      for (let x = checkMinX; x <= checkMaxX; x++) {
        for (let z = checkMinZ; z <= checkMaxZ; z++) {
          if (this.isSolid(x, blockY, z)) {
            collided = true;
            break;
          }
        }
        if (collided) break;
      }

      if (collided) {
        this.position.y = blockY + 1.0;
        this.velocity.y = 0;
        if (!this.isOnGround && !this.isInWater) {
          const fallen = this.highestFallY - this.position.y;
          if (fallen > 3.5) {
            const damage = Math.min(20, Math.floor((fallen - 3.0) * 1.5));
            if (damage > 0) {
              this.onFallDamage?.(damage);
            }
          }
        }
        this.highestFallY = this.position.y;
        this.isOnGround = true;
      }
    } else if (dy > 0) {
      // Jumping up - check ceiling
      const blockY = Math.floor(this.position.y + this.height);
      let collided = false;

      for (let x = checkMinX; x <= checkMaxX; x++) {
        for (let z = checkMinZ; z <= checkMaxZ; z++) {
          if (this.isSolid(x, blockY, z)) {
            collided = true;
            break;
          }
        }
        if (collided) break;
      }

      if (collided) {
        this.position.y = blockY - this.height;
        this.velocity.y = 0;
      }
    }

    // 2. Move on X axis
    this.position.x += dx;
    const newMinX = Math.floor(this.position.x - halfW);
    const newMaxX = Math.floor(this.position.x + halfW);
    const curMinY = Math.floor(this.position.y);
    const curMaxY = Math.floor(this.position.y + this.height - 0.05);

    if (dx < 0) {
      let collided = false;
      for (let y = curMinY; y <= curMaxY; y++) {
        for (let z = checkMinZ; z <= checkMaxZ; z++) {
          if (this.isSolid(newMinX, y, z)) {
            collided = true;
            break;
          }
        }
        if (collided) break;
      }
      if (collided) {
        this.position.x = newMinX + 1.0 + halfW;
        this.velocity.x = 0;
      }
    } else if (dx > 0) {
      let collided = false;
      for (let y = curMinY; y <= curMaxY; y++) {
        for (let z = checkMinZ; z <= checkMaxZ; z++) {
          if (this.isSolid(newMaxX, y, z)) {
            collided = true;
            break;
          }
        }
        if (collided) break;
      }
      if (collided) {
        this.position.x = newMaxX - halfW;
        this.velocity.x = 0;
      }
    }

    // 3. Move on Z axis
    this.position.z += dz;
    const finalMinX = Math.floor(this.position.x - halfW);
    const finalMaxX = Math.floor(this.position.x + halfW);
    const newMinZ = Math.floor(this.position.z - halfW);
    const newMaxZ = Math.floor(this.position.z + halfW);

    if (dz < 0) {
      let collided = false;
      for (let y = curMinY; y <= curMaxY; y++) {
        for (let x = finalMinX; x <= finalMaxX; x++) {
          if (this.isSolid(x, y, newMinZ)) {
            collided = true;
            break;
          }
        }
        if (collided) break;
      }
      if (collided) {
        this.position.z = newMinZ + 1.0 + halfW;
        this.velocity.z = 0;
      }
    } else if (dz > 0) {
      let collided = false;
      for (let y = curMinY; y <= curMaxY; y++) {
        for (let x = finalMinX; x <= finalMaxX; x++) {
          if (this.isSolid(x, y, newMaxZ)) {
            collided = true;
            break;
          }
        }
        if (collided) break;
      }
      if (collided) {
        this.position.z = newMaxZ - halfW;
        this.velocity.z = 0;
      }
    }
  }

  teleport(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
  }
}
