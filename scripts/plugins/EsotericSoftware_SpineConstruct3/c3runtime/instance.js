/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated April 5, 2025. Replaces all prior versions.
 *
 * Copyright (c) 2013-2025, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/
const C3 = globalThis.C3;
const spine = globalThis.spine;
spine.Skeleton.yDown = true;
class SpineC3Instance extends globalThis.ISDKWorldInstanceBase {
    constructor() {
        super();
        this.propAtlas = "";
        this.propSkel = "";
        this.propLoaderScale = 1;
        this.propSkin = [];
        this.propOffsetX = 0;
        this.propOffsetY = 0;
        this.propOffsetAngle = 0;
        this.propScaleX = 1;
        this.propScaleY = 1;
        this.propSlotZOffset = 0;
        this.propDebugSkeleton = false;
        this.propBoundsProvider = "setup";
        this.propEnableCollision = false;
        this.collisionSpriteClassName = "";
        this.collisionBoundingBoxSlotName = "";
        this.collisionBoundingBoxAttachmentName = "";
        this.collisionBoundingBoxVertices = spine.Utils.newFloatArray(128);
        this.collisionBoundingBoxGamePoints = [];
        this.collisionBoundingBoxDebug = false;
        this.collisionBoundingBoxMeshSize = [0, 0];
        this.collisionBodyDrivesObject = false;
        this.collisionBodyPrevX = 0;
        this.collisionBodyPrevY = 0;
        this.collisionBodyPrevAngle = 0;
        this.isPlaying = true;
        this.physicsMode = spine.Physics.update;
        this.customSkins = {};
        this.atlasLoaded = false;
        this.atlasLoading = false;
        this.skeletonLoaded = false;
        this.skeletonLoading = false;
        this.triggeredEventTrack = -1;
        this.triggeredEventAnimation = "";
        this.triggeredEventName = "";
        this.quaternion = [0, 0, 0, 1];
        this.requestRedraw = false;
        this.triggerSkeletonLoadedOnFirstTick = false;
        this.spineBounds = {
            x: 0,
            y: 0,
            width: 200,
            height: 200,
        };
        this.verticesTemp = spine.Utils.newFloatArray(2 * 1024);
        this.boneFollowers = new Map();
        this.bonesOverride = new Map();
        this.dragHandles = new Set();
        this.prevLeftClickDown = false;
        /**********/
        /*
         *  Drag handles
         */
        this.touchDown = false;
        this.touchX = 0;
        this.touchY = 0;
        this.dragHandleDown = (event) => {
            if (event.button !== 0)
                return;
            this.touchDown = true;
            this.touchX = event.clientX;
            this.touchY = event.clientY;
        };
        this.dragHandleMove = (event) => {
            if (!this.touchDown)
                return;
            this.touchX = event.clientX;
            this.touchY = event.clientY;
        };
        this.dragHandleUp = (event) => {
            if (event.button === 0)
                this.touchDown = false;
        };
        const properties = this._getInitProperties();
        if (properties) {
            this.propAtlas = properties[0];
            this.propSkel = properties[1];
            this.propLoaderScale = properties[2];
            const skinProp = properties[3];
            this.propSkin = skinProp === "" ? [] : skinProp.split(",");
            const animationProp = properties[4];
            this.propAnimation = animationProp === "" ? undefined : animationProp;
            this.propDebugSkeleton = properties[5];
            this.propEnableCollision = properties[6];
            const boundsProviderIndex = properties[7];
            this.propBoundsProvider = boundsProviderIndex === 0 ? "setup" : "animation-skin";
            // properties[8] is PROP_BOUNDS_PROVIDER_MOVE
            this.propOffsetX = properties[9];
            this.propOffsetY = properties[10];
            this.propOffsetAngle = properties[11];
            this.propScaleX = properties[12];
            this.propScaleY = properties[13];
            this.propSlotZOffset = properties[14] ?? 0;
        }
        this.collisionSpriteClassName = `${this.objectType.name}_CollisionBody`;
        this.assetLoader = new spine.AssetLoader();
        this.matrix = new spine.C3Matrix();
        this.renderer ||= this.runtime.renderer;
        this.initializeCachedSpine(false);
        this._setTicking(true);
    }
    /*
     *  Update, render, draw
     */
    play() {
        this.isPlaying = true;
    }
    stop() {
        this.isPlaying = false;
    }
    updateMatrix() {
        this.quaternion = this.getQuaternion();
        this.matrix.update(this.x + this.propOffsetX, this.y + this.propOffsetY, this.totalZ, this.angle, this.width / this.spineBounds.width * this.propScaleX, this.height / this.spineBounds.height * this.propScaleY, this.quaternion, this.propOffsetAngle);
    }
    _tick() {
        this.renderer ||= this.runtime.renderer;
        if (!this.renderer)
            return;
        if (!this.skeletonLoaded) {
            if (!this.initializeCachedSpine(true)) {
                this.loadSpine();
                return;
            }
        }
        if (this.triggerSkeletonLoadedOnFirstTick) {
            this.triggerSkeletonLoadedOnFirstTick = false;
            this.initializeInitialSkeletonState();
            this._trigger(C3.Plugins.EsotericSoftware_SpineConstruct3.Cnds.OnSkeletonLoaded);
        }
        this.updateMatrix();
        this.updateCollisionSprite();
        if (this.isPlaying)
            this.update(this.dt);
    }
    update(delta) {
        const { state, skeleton, physicsMode, matrix } = this;
        if (!skeleton || !state)
            return;
        state.update(delta);
        skeleton.update(delta);
        state.apply(skeleton);
        this.updateHandles(skeleton, matrix);
        this.updateBonesOverride();
        skeleton.updateWorldTransform(physicsMode);
        this.updateCollisionSprite();
        this.updateBoneFollowers(matrix);
        this.runtime.sdk.updateRender();
        this.requestRedraw = true;
    }
    _draw(renderer) {
        this.renderer ||= renderer;
        if (!this.isVisible)
            return;
        if (!this.isOnScreen)
            return;
        const { skeleton } = this;
        if (!skeleton)
            return;
        this.skeletonRenderer ||= new spine.C3RendererRuntime(renderer, this.matrix);
        const slotZOffset = this.layer.renderingMode === "3d" ? this.propSlotZOffset : 0;
        this.skeletonRenderer.draw(skeleton, this.colorRgb, this.opacity, this.requestRedraw, slotZOffset);
        this.requestRedraw = false;
        if (this.propDebugSkeleton)
            this.skeletonRenderer.drawDebug(skeleton, this.x, this.y, this.getBoundingQuad(false));
        this.renderCollisionBoundingBoxDebug(renderer);
        this.renderDragHandles();
    }
    renderCollisionBoundingBoxDebug(renderer) {
        const points = this.collisionBoundingBoxGamePoints;
        if (!this.collisionBoundingBoxDebug || points.length < 6 || !this.collisionSpriteInstance?.isCollisionEnabled)
            return;
        renderer.setColorFillMode();
        renderer.setColorRgba(1, 0, 0, 1);
        renderer.pushLineWidth(2);
        for (let i = 0; i < points.length; i += 2) {
            const next = (i + 2) % points.length;
            renderer.line(points[i], points[i + 1], points[next], points[next + 1]);
        }
        renderer.popLineWidth();
        renderer.setTextureFillMode();
        renderer.setColorRgba(1, 1, 1, 1);
    }
    renderDragHandles() {
        for (const { bone, radius, debug } of this.dragHandles) {
            if (!debug)
                continue;
            this.skeletonRenderer?.renderDragHandles(bone, radius);
        }
    }
    addDragHandle(type, name, radius = 10, debug = false) {
        if (type === 0) {
            const bone = this.getBone(name);
            if (!bone)
                return;
            this.dragHandles.add({ bone, debug, radius, offsetX: 0, offsetY: 0 });
        }
        else {
            const slot = this.getSlot(name);
            if (!slot)
                return;
            this.dragHandles.add({ slot, bone: slot.bone, debug, radius, offsetX: 0, offsetY: 0 });
        }
        if (this.dragHandles.size === 1) {
            this.touchDown = false;
            this.runtime.addEventListener("pointerdown", this.dragHandleDown);
            this.runtime.addEventListener("pointermove", this.dragHandleMove);
            this.runtime.addEventListener("pointerup", this.dragHandleUp);
        }
        this.isPlaying = true;
    }
    dragHandleDispose() {
        this.runtime.removeEventListener("pointerdown", this.dragHandleDown);
        this.runtime.removeEventListener("pointermove", this.dragHandleMove);
        this.runtime.removeEventListener("pointerup", this.dragHandleUp);
    }
    removeDragHandle(type, name) {
        if (type === 0) {
            const bone = this.getBone(name);
            if (!bone)
                return;
            for (const handle of this.dragHandles) {
                if (handle.bone === bone && !handle.slot) {
                    this.dragHandles.delete(handle);
                    break;
                }
            }
        }
        else {
            const slot = this.getSlot(name);
            if (!slot)
                return;
            for (const handle of this.dragHandles) {
                if (handle.slot === slot) {
                    this.dragHandles.delete(handle);
                    break;
                }
            }
        }
        if (this.dragHandles.size === 0)
            this.dragHandleDispose();
    }
    updateHandles(skeleton, matrix) {
        if (this.dragHandles.size === 0)
            return;
        const { touchDown } = this;
        if (!touchDown) {
            if (this.prevLeftClickDown) {
                this.prevLeftClickDown = false;
                for (const handleObject of this.dragHandles)
                    handleObject.dragging = false;
            }
            return;
        }
        const { touchX, touchY } = this;
        for (const handleObject of this.dragHandles) {
            const bone = handleObject.bone;
            if (handleObject.dragging) {
                const pose = bone.pose;
                if (bone.parent) {
                    const { x, y } = matrix.gameToBone(touchX - handleObject.offsetX, touchY - handleObject.offsetY, bone);
                    pose.x = x;
                    pose.y = y;
                }
                else {
                    const { x, y } = matrix.gameToSkeleton(touchX - handleObject.offsetX, touchY - handleObject.offsetY);
                    pose.x = x;
                    pose.y = -y * spine.Skeleton.yDir;
                }
            }
            else if (!this.prevLeftClickDown) {
                const { x: boneGameX, y: boneGameY } = matrix.boneToGame(bone);
                const inside = handleObject.slot
                    ? this.isInsideSlot(touchX, touchY, handleObject.slot)
                    : this.inRadius(touchX, touchY, boneGameX, boneGameY, handleObject.radius);
                if (inside) {
                    handleObject.dragging = true;
                    handleObject.offsetX = touchX - boneGameX;
                    handleObject.offsetY = touchY - boneGameY;
                }
            }
        }
        this.prevLeftClickDown = true;
    }
    isInsideSlot(x, y, slotName, skeletonCoordinate = false) {
        const slot = this.getSlot(slotName);
        if (!slot || !slot.bone.active)
            return false;
        const attachment = slot.appliedPose.attachment;
        if (!(attachment instanceof spine.RegionAttachment || attachment instanceof spine.MeshAttachment))
            return false;
        const vertices = this.verticesTemp;
        let hullLength = 8;
        if (attachment instanceof spine.RegionAttachment) {
            attachment.computeWorldVertices(slot, attachment.getOffsets(slot.appliedPose), vertices, 0, 2);
        }
        else if (attachment instanceof spine.MeshAttachment) {
            attachment.computeWorldVertices(this.skeleton, slot, 0, attachment.worldVerticesLength, vertices, 0, 2);
            hullLength = attachment.hullLength;
        }
        if (skeletonCoordinate)
            return this.isPointInPolygon(vertices, hullLength, x, y);
        const coords = this.matrix.gameToSkeleton(x, y);
        return this.isPointInPolygon(vertices, hullLength, coords.x, coords.y);
    }
    isInsideBone(x, y, boneName, radius) {
        const bone = this.getBone(boneName);
        if (!bone || !bone.active)
            return false;
        const bonePos = this.matrix.boneToGame(bone);
        return this.inRadius(x, y, bonePos.x, bonePos.y, radius);
    }
    isAnimationPlaying(animationName, trackIndex) {
        if (!this.state)
            return false;
        if (trackIndex === -1) {
            for (const track of this.state.tracks) {
                if (!track)
                    continue;
                if (animationName === "" || track.animation?.name === animationName)
                    return true;
            }
            return false;
        }
        const track = this.state.getTrack(trackIndex);
        if (!track)
            return false;
        if (animationName === "")
            return true;
        return track.animation?.name === animationName;
    }
    isPointInPolygon(vertices, hullLength, px, py) {
        if (hullLength < 6) {
            throw new Error("A polygon must have at least 3 vertices (6 numbers in the array).");
        }
        let isInside = false;
        for (let i = 0, j = hullLength - 2; i < hullLength; i += 2) {
            const xi = vertices[i], yi = vertices[i + 1];
            const xj = vertices[j], yj = vertices[j + 1];
            const intersects = ((yi > py) !== (yj > py)) &&
                (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
            if (intersects)
                isInside = !isInside;
            j = i;
        }
        return isInside;
    }
    inRadius(x1, y1, x2, y2, radius) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distanceSquared = dx * dx + dy * dy;
        return distanceSquared <= radius * radius;
    }
    /**********/
    /*
    *  C3 Internals
    */
    _saveToJson() {
        // Save/load support is deferred; Spine-specific mutable runtime state is not persisted yet.
        return {};
    }
    _loadFromJson(o) {
        // Save/load support is deferred; Spine-specific mutable runtime state is not persisted yet.
    }
    _release() {
        super._release();
        this.assetLoader.releaseInstanceResources(this.propSkel, this.propAtlas, this.propLoaderScale);
        this.textureAtlas = undefined;
        this.renderer = undefined;
        this.skeleton = undefined;
        this.state = undefined;
        this.dragHandleDispose();
        if (this.collisionSpriteInstance) {
            this.collisionSpriteInstance.destroy();
            this.collisionSpriteInstance = undefined;
        }
    }
    /**********/
    /*
    *  Spine Internals
    */
    initializeCachedSpine(triggerLoaded) {
        if (this.skeletonLoaded || !this.renderer)
            return false;
        const cached = this.assetLoader.getCachedRuntimeSkeletonAndAtlas(this.propSkel, this.propAtlas, this.propLoaderScale);
        if (!cached)
            return false;
        this.initializeSkeleton(cached.textureAtlas, cached.skeletonData, triggerLoaded);
        return true;
    }
    async loadSpine() {
        const { renderer, propAtlas, propSkel, propLoaderScale } = this;
        if (this.skeletonLoading || this.skeletonLoaded || !renderer)
            return;
        if (!propAtlas || !propSkel)
            return;
        if (this.initializeCachedSpine(true))
            return;
        this.skeletonLoading = true;
        this.atlasLoading = true;
        try {
            const textureAtlas = await this.assetLoader.loadAtlasRuntime(propAtlas, this.plugin.runtime, renderer);
            if (this.renderer !== renderer)
                return;
            this.textureAtlas = textureAtlas;
            this.atlasLoaded = true;
            this.atlasLoading = false;
            const skeletonData = await this.assetLoader.loadSkeletonRuntime(propSkel, propAtlas, textureAtlas, propLoaderScale, this.plugin.runtime);
            if (this.renderer !== renderer)
                return;
            this.initializeSkeleton(textureAtlas, skeletonData, true);
        }
        catch (error) {
            if (this.renderer === renderer)
                console.error("[Spine] Failed to load skeleton:", error);
        }
        finally {
            if (this.renderer === renderer && !this.skeletonLoaded) {
                this.skeletonLoading = false;
                this.atlasLoading = false;
            }
        }
    }
    initializeSkeleton(textureAtlas, skeletonData, triggerLoaded) {
        this.textureAtlas = textureAtlas;
        this.atlasLoaded = true;
        this.atlasLoading = false;
        this.skeleton = new spine.Skeleton(skeletonData);
        const animationStateData = new spine.AnimationStateData(skeletonData);
        this.state = new spine.AnimationState(animationStateData);
        this.state.addListener({
            start: (entry) => this.triggerAnimationEvent("start", entry.trackIndex, entry.animation?.name ?? ""),
            dispose: (entry) => this.triggerAnimationEvent("dispose", entry.trackIndex, entry.animation?.name ?? ""),
            event: (entry, event) => this.triggerAnimationEvent("event", entry.trackIndex, entry.animation?.name ?? "", event),
            interrupt: (entry) => this.triggerAnimationEvent("interrupt", entry.trackIndex, entry.animation?.name ?? ""),
            end: (entry) => this.triggerAnimationEvent("end", entry.trackIndex, entry.animation?.name ?? ""),
            complete: (entry) => this.triggerAnimationEvent("complete", entry.trackIndex, entry.animation?.name ?? ""),
        });
        this.skeletonLoaded = true;
        this.skeletonLoading = false;
        if (triggerLoaded) {
            this.initializeInitialSkeletonState();
            this._trigger(C3.Plugins.EsotericSoftware_SpineConstruct3.Cnds.OnSkeletonLoaded);
        }
        else {
            this.triggerSkeletonLoadedOnFirstTick = true;
        }
    }
    initializeInitialSkeletonState() {
        this._setSkin();
        if (this.propAnimation)
            this.setAnimation(0, this.propAnimation, true);
        this.calculateBounds();
        this.update(0);
        this.createCollisionSprite();
    }
    createCollisionSprite() {
        if (!this.propEnableCollision)
            return;
        const objectType = this.runtime.objects[this.collisionSpriteClassName];
        if (!objectType)
            throw new Error(`[Spine] Collision sprite object type "${this.collisionSpriteClassName}" not found`);
        this.collisionSpriteInstance = objectType.createInstance(this.layer.name, this.x, this.y);
        this.syncCollisionSprite3DTransform(this.collisionSpriteInstance, this.x, this.y);
        this.collisionSpriteInstance.angle = this.angle;
        this.collisionSpriteInstance.setOrigin(this.originX, this.originY);
    }
    syncCollisionSprite3DTransform(collisionSpriteInstance, x, y, syncQuaternion = true) {
        collisionSpriteInstance.setPosition3d(x, y, this.z);
        if (syncQuaternion) {
            collisionSpriteInstance.setQuaternion(...this.quaternion);
        }
        else {
            collisionSpriteInstance.setQuaternion(0, 0, 0, 1);
        }
    }
    captureCollisionBodyTransform(collisionSpriteInstance) {
        this.collisionBodyPrevX = collisionSpriteInstance.x;
        this.collisionBodyPrevY = collisionSpriteInstance.y;
        this.collisionBodyPrevAngle = collisionSpriteInstance.angle;
    }
    updateCollisionSprite() {
        this.updateObjectFromCollisionBody();
        if (!this.collisionSpriteInstance)
            return;
        if (this.collisionBoundingBoxSlotName && this.collisionBoundingBoxAttachmentName) {
            this.updateCollisionBoundingBoxSprite();
            return;
        }
        if (this.collisionBoundingBoxMeshSize[0] !== 0) {
            this.collisionSpriteInstance.releaseMesh();
            this.collisionBoundingBoxMeshSize = [0, 0];
        }
        this.collisionSpriteInstance.isCollisionEnabled = true;
        this.syncCollisionSprite3DTransform(this.collisionSpriteInstance, this.x, this.y);
        this.collisionSpriteInstance.setSize(this.width, this.height);
        this.collisionSpriteInstance.angle = this.angle;
        this.collisionSpriteInstance.setOrigin(this.originX, this.originY);
        if (this.collisionBodyDrivesObject)
            this.captureCollisionBodyTransform(this.collisionSpriteInstance);
    }
    updateCollisionBoundingBoxSprite() {
        const { skeleton, collisionSpriteInstance } = this;
        if (!skeleton || !collisionSpriteInstance)
            return;
        const slot = this.collisionBoundingBoxSlot ?? skeleton.findSlot(this.collisionBoundingBoxSlotName) ?? undefined;
        this.collisionBoundingBoxSlot = slot;
        if (!slot || !slot.bone.active) {
            collisionSpriteInstance.isCollisionEnabled = false;
            return;
        }
        const attachment = slot.appliedPose.attachment;
        if (!(attachment instanceof spine.BoundingBoxAttachment) || attachment.name !== this.collisionBoundingBoxAttachmentName) {
            collisionSpriteInstance.isCollisionEnabled = false;
            return;
        }
        const vertexCount = attachment.worldVerticesLength >> 1;
        if (vertexCount < 3) {
            collisionSpriteInstance.isCollisionEnabled = false;
            return;
        }
        if (this.collisionBoundingBoxVertices.length < attachment.worldVerticesLength)
            this.collisionBoundingBoxVertices = spine.Utils.newFloatArray(attachment.worldVerticesLength);
        attachment.computeWorldVertices(skeleton, slot, 0, attachment.worldVerticesLength, this.collisionBoundingBoxVertices, 0, 2);
        let minX = Number.POSITIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;
        const gamePoints = this.collisionBoundingBoxGamePoints;
        gamePoints.length = 0;
        for (let i = 0; i < attachment.worldVerticesLength; i += 2) {
            const point = this.matrix.skeletonToGame(this.collisionBoundingBoxVertices[i], this.collisionBoundingBoxVertices[i + 1]);
            const x = point.x;
            const y = point.y;
            gamePoints.push(x, y);
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        const width = Math.max(maxX - minX, 1);
        const height = Math.max(maxY - minY, 1);
        const meshWidth = Math.max(2, Math.ceil(vertexCount / 2));
        const meshHeight = 2;
        if (this.collisionBoundingBoxMeshSize[0] !== meshWidth || this.collisionBoundingBoxMeshSize[1] !== meshHeight) {
            collisionSpriteInstance.createMesh(meshWidth, meshHeight);
            this.collisionBoundingBoxMeshSize = [meshWidth, meshHeight];
        }
        collisionSpriteInstance.isCollisionEnabled = true;
        // These mesh points are already transformed to game-space by the legacy
        // 2D matrix, so applying the quaternion again would double-transform them.
        this.syncCollisionSprite3DTransform(collisionSpriteInstance, minX, minY, false);
        collisionSpriteInstance.setSize(width, height);
        collisionSpriteInstance.angle = 0;
        collisionSpriteInstance.setOrigin(0, 0);
        if (this.collisionBodyDrivesObject)
            this.captureCollisionBodyTransform(collisionSpriteInstance);
        const perimeterPointCount = meshWidth * 2;
        for (let i = 0; i < perimeterPointCount; i++) {
            const sourceIndex = Math.min(i, vertexCount - 1) * 2;
            const meshX = (gamePoints[sourceIndex] - minX) / width;
            const meshY = (gamePoints[sourceIndex + 1] - minY) / height;
            if (i < meshWidth) {
                collisionSpriteInstance.setMeshPoint(i, 0, { mode: "absolute", x: meshX, y: meshY });
            }
            else {
                collisionSpriteInstance.setMeshPoint(perimeterPointCount - 1 - i, 1, { mode: "absolute", x: meshX, y: meshY });
            }
        }
    }
    setCollisionBoundingBox(slotName, attachmentName) {
        this.collisionBoundingBoxSlotName = slotName;
        this.collisionBoundingBoxAttachmentName = attachmentName;
        this.collisionBoundingBoxSlot = this.skeleton?.findSlot(slotName) ?? undefined;
        if (slotName && attachmentName)
            this.skeleton?.setAttachment(slotName, attachmentName);
        this.updateCollisionSprite();
    }
    clearCollisionBoundingBox() {
        this.collisionBoundingBoxSlotName = "";
        this.collisionBoundingBoxAttachmentName = "";
        this.collisionBoundingBoxSlot = undefined;
        this.collisionBoundingBoxGamePoints.length = 0;
        this.updateCollisionSprite();
    }
    setCollisionBoundingBoxDebug(enabled) {
        this.collisionBoundingBoxDebug = enabled;
        this.requestRedraw = true;
        this.runtime.sdk.updateRender();
    }
    hasCollisionBody() {
        return !!this.collisionSpriteInstance;
    }
    getCollisionBodyUid() {
        return this.collisionSpriteInstance?.uid ?? -1;
    }
    getBoundingBoxInfo(slotName, attachmentName) {
        const { skeleton } = this;
        if (!skeleton || !slotName || !attachmentName)
            return null;
        const slot = skeleton.findSlot(slotName);
        if (!slot || !slot.bone.active)
            return null;
        const attachment = skeleton.getAttachment(slot.data.index, attachmentName);
        if (!(attachment instanceof spine.BoundingBoxAttachment))
            return null;
        const vertexCount = attachment.worldVerticesLength >> 1;
        if (vertexCount < 3)
            return null;
        if (this.collisionBoundingBoxVertices.length < attachment.worldVerticesLength)
            this.collisionBoundingBoxVertices = spine.Utils.newFloatArray(attachment.worldVerticesLength);
        attachment.computeWorldVertices(skeleton, slot, 0, attachment.worldVerticesLength, this.collisionBoundingBoxVertices, 0, 2);
        let left = Number.POSITIVE_INFINITY;
        let top = Number.POSITIVE_INFINITY;
        let right = Number.NEGATIVE_INFINITY;
        let bottom = Number.NEGATIVE_INFINITY;
        const points = [];
        for (let i = 0; i < attachment.worldVerticesLength; i += 2) {
            const point = this.matrix.skeletonToGame(this.collisionBoundingBoxVertices[i], this.collisionBoundingBoxVertices[i + 1]);
            points.push(point.x, point.y);
            left = Math.min(left, point.x);
            top = Math.min(top, point.y);
            right = Math.max(right, point.x);
            bottom = Math.max(bottom, point.y);
        }
        return { points, left, top, right, bottom };
    }
    getBoundingBoxPointCount(slotName, attachmentName) {
        return (this.getBoundingBoxInfo(slotName, attachmentName)?.points.length ?? 0) / 2;
    }
    getBoundingBoxPointX(slotName, attachmentName, index) {
        const points = this.getBoundingBoxInfo(slotName, attachmentName)?.points;
        const pointIndex = Math.floor(index) * 2;
        return points && pointIndex >= 0 && pointIndex < points.length ? points[pointIndex] : 0;
    }
    getBoundingBoxPointY(slotName, attachmentName, index) {
        const points = this.getBoundingBoxInfo(slotName, attachmentName)?.points;
        const pointIndex = Math.floor(index) * 2 + 1;
        return points && pointIndex >= 1 && pointIndex < points.length ? points[pointIndex] : 0;
    }
    getBoundingBoxCenterX(slotName, attachmentName) {
        const info = this.getBoundingBoxInfo(slotName, attachmentName);
        return info ? (info.left + info.right) / 2 : 0;
    }
    getBoundingBoxCenterY(slotName, attachmentName) {
        const info = this.getBoundingBoxInfo(slotName, attachmentName);
        return info ? (info.top + info.bottom) / 2 : 0;
    }
    getBoundingBoxLeft(slotName, attachmentName) {
        return this.getBoundingBoxInfo(slotName, attachmentName)?.left ?? 0;
    }
    getBoundingBoxTop(slotName, attachmentName) {
        return this.getBoundingBoxInfo(slotName, attachmentName)?.top ?? 0;
    }
    getBoundingBoxRight(slotName, attachmentName) {
        return this.getBoundingBoxInfo(slotName, attachmentName)?.right ?? 0;
    }
    getBoundingBoxBottom(slotName, attachmentName) {
        return this.getBoundingBoxInfo(slotName, attachmentName)?.bottom ?? 0;
    }
    getBoundingBoxPolygonJson(slotName, attachmentName) {
        return JSON.stringify(this.getBoundingBoxInfo(slotName, attachmentName)?.points ?? []);
    }
    setRuntimeAssetCacheRetainedWhenUnused(enabled, scope) {
        if (scope === "all") {
            this.assetLoader.setAllRuntimeResourcesRetained(enabled);
        }
        else {
            this.assetLoader.retainInstanceResources(this.propSkel, this.propAtlas, this.propLoaderScale, enabled);
        }
    }
    releaseCachedSpineAssets() {
        this.assetLoader.releaseRetainedInstanceResources(this.propSkel, this.propAtlas, this.propLoaderScale);
    }
    releaseAllCachedSpineAssets() {
        this.assetLoader.releaseAllUnusedRuntimeResources();
    }
    setCollisionBodyDrivesObject(enabled) {
        if (enabled === this.collisionBodyDrivesObject)
            return;
        if (enabled) {
            this.collisionBodyDrivesObject = false;
            this.updateCollisionSprite();
            this.collisionBodyDrivesObject = true;
            if (this.collisionSpriteInstance) {
                this.captureCollisionBodyTransform(this.collisionSpriteInstance);
            }
            else {
                this.collisionBodyPrevX = this.x;
                this.collisionBodyPrevY = this.y;
                this.collisionBodyPrevAngle = this.angle;
            }
        }
        else {
            this.collisionBodyDrivesObject = false;
            this.updateCollisionSprite();
        }
    }
    updateObjectFromCollisionBody() {
        const collisionSpriteInstance = this.collisionSpriteInstance;
        if (!this.collisionBodyDrivesObject || !collisionSpriteInstance)
            return;
        const dx = collisionSpriteInstance.x - this.collisionBodyPrevX;
        const dy = collisionSpriteInstance.y - this.collisionBodyPrevY;
        const angle = collisionSpriteInstance.angle;
        const angleChanged = angle !== this.collisionBodyPrevAngle;
        this.captureCollisionBodyTransform(collisionSpriteInstance);
        if (dx === 0 && dy === 0 && !angleChanged)
            return;
        if (dx !== 0 || dy !== 0)
            this.offsetPosition(dx, dy);
        if (angleChanged)
            this.angle = angle;
        this.updateMatrix();
    }
    calculateBounds() {
        const { skeleton } = this;
        if (!skeleton)
            return;
        let boundsProvider;
        if (this.propBoundsProvider === "animation-skin") {
            const { propSkin, propAnimation } = this;
            if ((propSkin && propSkin.length > 0) || propAnimation) {
                boundsProvider = new spine.SkinsAndAnimationBoundsProvider(propAnimation, propSkin);
            }
            else {
                boundsProvider = new spine.SetupPoseBoundsProvider();
            }
        }
        else if (this.propBoundsProvider === "setup") {
            boundsProvider = new spine.SetupPoseBoundsProvider();
        }
        else {
            boundsProvider = new spine.AABBRectangleBoundsProvider(0, 0, 100, 100);
        }
        this.spineBounds = boundsProvider.calculateBounds(this);
    }
    /**********/
    /*
    *  Animations
    */
    getAnimations() {
        return this.skeleton?.data.animations.map(animation => animation.name).join("\n") ?? "";
    }
    getAnimationsCount() {
        return this.skeleton?.data.animations.length ?? 0;
    }
    getAnimationName(index) {
        return this.skeleton?.data.animations[Math.floor(index)]?.name ?? "";
    }
    setAnimation(track, animation, loop = false, additive = false) {
        const { state } = this;
        if (!state)
            return;
        const entry = state.setAnimation(track, animation, loop);
        entry.additive = additive;
        this.isPlaying = true;
    }
    addAnimation(track, animation, loop = false, delay = 0, additive = false) {
        const { state } = this;
        if (!state)
            return;
        const entry = state.addAnimation(track, animation, loop, delay);
        entry.additive = additive;
        this.isPlaying = true;
    }
    addEmptyAnimation(track, mixDuration, delay) {
        this.state?.addEmptyAnimation(track, mixDuration, delay);
    }
    setEmptyAnimation(track, mixDuration) {
        this.state?.setEmptyAnimation(track, mixDuration);
    }
    getCurrentAnimation(trackIndex) {
        if (!this.skeleton)
            return "";
        const { state } = this;
        if (!state)
            return "";
        const track = state.getTrack(trackIndex);
        if (!track || !track.animation)
            return "";
        return track.animation.name;
    }
    setTimeScale(track, timeScale) {
        if (!this.state)
            return;
        if (track < 0) {
            this.state.timeScale = timeScale;
        }
        else {
            const entry = this.state.getTrack(track);
            if (entry)
                entry.timeScale = timeScale;
        }
    }
    setAnimationTime(units, time, track) {
        if (!this.state)
            return;
        const trackEntry = this.state.getTrack(track);
        if (!trackEntry)
            return;
        if (units === 0) {
            if (time < trackEntry.animationStart || time > trackEntry.animationEnd) {
                console.warn(`[Spine] Animation time ${time} is out of bounds [${trackEntry.animationStart}, ${trackEntry.animationEnd}]`);
                return;
            }
            trackEntry.trackTime = time;
        }
        else {
            if (time < 0 || time > 1) {
                console.warn(`[Spine] Animation time ratio ${time} is out of bounds [0, 1]`);
                return;
            }
            trackEntry.trackTime = trackEntry.animationStart + time * (trackEntry.animationEnd - trackEntry.animationStart);
        }
    }
    setAnimationMix(fromName, toName, duration) {
        const stateData = this.state?.data;
        if (!stateData)
            return;
        try {
            stateData.setMix(fromName, toName, duration);
        }
        catch (error) {
            console.error('[Spine] setAnimationMix error:', error);
        }
    }
    setDefaultMix(duration) {
        const stateData = this.state?.data;
        if (!stateData) {
            console.warn('[Spine] setDefaultMix: no state data');
            return;
        }
        stateData.defaultMix = duration;
    }
    setTrackAlpha(alpha, trackIndex) {
        const { state } = this;
        if (!state) {
            console.warn('[Spine] setAlpha: no state');
            return;
        }
        const track = state.getTrack(trackIndex);
        if (!track) {
            console.warn(`[Spine] setAlpha: track ${trackIndex} not found`);
            return;
        }
        track.alpha = spine.MathUtils.clamp(alpha, 0, 1);
    }
    clearTrack(track) {
        const { state } = this;
        if (!state)
            return;
        if (track === -1)
            state.clearTracks();
        else
            state.clearTrack(track);
    }
    triggerAnimationEvent(eventName, track, animation, event) {
        this.triggeredEventTrack = track;
        this.triggeredEventAnimation = animation;
        this.triggeredEventName = eventName;
        this.triggeredEventData = event ? { ...event, track, animation } : undefined;
        this._trigger(C3.Plugins.EsotericSoftware_SpineConstruct3.Cnds.OnAnimationEvent);
    }
    /**********/
    /*
    *  Skins
    */
    setSkin(skins) {
        this.propSkin = skins;
        this._setSkin();
    }
    getCurrentSkin() {
        if (!this.skeleton)
            return "";
        const skin = this.skeleton.skin;
        if (!skin)
            return "";
        return skin.name;
    }
    _setSkin() {
        const { skeleton } = this;
        if (!skeleton)
            return;
        const skins = this.propSkin;
        if (skins.length === 0) {
            skeleton.setSkin(null);
        }
        else if (skins.length === 1) {
            const skinName = skins[0];
            const skin = skeleton.data.findSkin(skinName);
            if (!skin)
                throw new Error(`The given skin is not present in the skeleton data: ${skinName}`);
            skeleton.setSkin(skins[0]);
        }
        else {
            const customSkin = new spine.Skin(skins.join(","));
            for (const s of skins) {
                const skin = skeleton.data.findSkin(s);
                if (!skin)
                    throw new Error(`The given skin is not present in the skeleton data: ${s}`);
                customSkin.addSkin(skin);
            }
            skeleton.setSkin(customSkin);
        }
        skeleton.setupPose();
    }
    createCustomSkin(skinName) {
        if (!this.skeleton)
            return;
        if (this.customSkins[skinName])
            this.customSkins[skinName].clear();
        else
            this.customSkins[skinName] = new spine.Skin(skinName);
    }
    addCustomSkin(customSkinName, skinToAddName) {
        if (!this.skeleton)
            return;
        if (!this.customSkins[customSkinName]) {
            console.warn(`[Spine] Custom skin "${customSkinName}" does not exist. Create it first.`);
            return;
        }
        const skinToAdd = this.skeleton.data.findSkin(skinToAddName);
        if (!skinToAdd) {
            console.warn(`[Spine] Skin "${skinToAddName}" not found in skeleton data.`);
            return;
        }
        this.customSkins[customSkinName].addSkin(skinToAdd);
    }
    setCustomSkin(skinName) {
        if (!this.skeleton)
            return;
        if (!this.customSkins[skinName]) {
            console.warn(`[Spine] Custom skin "${skinName}" does not exist.`);
            return;
        }
        this.skeleton.setSkin(this.customSkins[skinName]);
        this.skeleton.setupPose();
    }
    /**********/
    /*
    *  Slot, skeleton color
    */
    setSkeletonColor(color) {
        const { skeleton } = this;
        if (!skeleton) {
            console.warn('[Spine] setSkeletonColor: no skeleton');
            return;
        }
        skeleton.color.setFromString(color);
    }
    setSlotColor(slotName, color) {
        const { skeleton } = this;
        if (!skeleton) {
            console.warn('[Spine] setSlotColor: no skeleton');
            return;
        }
        const slot = skeleton.findSlot(slotName);
        if (!slot) {
            console.warn(`[Spine] setSlotColor: slot not found: ${slotName}`);
            return;
        }
        slot.pose.color.setFromString(color);
    }
    resetSlotColors(slotName = "") {
        const { skeleton } = this;
        if (!skeleton) {
            console.warn('[Spine] resetSlotColors: no skeleton');
            return;
        }
        if (slotName === "") {
            for (const slot of skeleton.slots)
                slot.pose.color.setFromColor(slot.data.setupPose.color);
        }
        else {
            const slot = skeleton.findSlot(slotName);
            if (!slot) {
                console.warn(`[Spine] resetSlotColors: slot not found: ${slotName}`);
                return;
            }
            slot.pose.color.setFromColor(slot.data.setupPose.color);
        }
    }
    /**********/
    /*
    *  Bone follower
    */
    attachInstanceToBone(uid, boneName, offsetX = 0, offsetY = 0, offsetAngle = 0, offsetScaleX = 1, offsetScaleY = 1) {
        if (!this.skeleton)
            return;
        this.updateMatrix();
        this.updateBonesOverride();
        this.skeleton.updateWorldTransform(this.physicsMode === spine.Physics.none ? spine.Physics.none : spine.Physics.pose);
        const bone = this.skeleton.findBone(boneName);
        if (!bone) {
            console.warn(`[Spine] attachInstanceToBone: bone not found: ${boneName}`);
            return;
        }
        const instance = this.runtime.getInstanceByUid(uid);
        if (!instance)
            return;
        const refGameScale = this.getSkeletonGameScale(this.matrix);
        const follower = {
            uid, offsetX, offsetY, offsetAngle, offsetScaleX, offsetScaleY,
            originalWidth: Math.abs(instance.width),
            originalHeight: Math.abs(instance.height),
            refGameScaleX: refGameScale.scaleX,
            refGameScaleY: refGameScale.scaleY,
        };
        const followers = this.boneFollowers.get(boneName);
        if (!followers) {
            this.boneFollowers.set(boneName, [follower]);
        }
        else {
            followers.push(follower);
        }
        this.updateBoneFollowers(this.matrix);
        this.isPlaying = true;
    }
    detachInstanceFromBoneByUid(uid, boneName) {
        const followers = this.boneFollowers.get(boneName);
        if (!followers)
            return;
        const index = followers.findIndex(f => f.uid === uid);
        if (index !== -1) {
            followers.splice(index, 1);
            if (followers.length === 0) {
                this.boneFollowers.delete(boneName);
            }
        }
    }
    detachAllFromBone(boneName) {
        this.boneFollowers.delete(boneName);
    }
    getSkeletonGameScale(matrix) {
        return {
            scaleX: Math.hypot(matrix.a, matrix.b),
            scaleY: Math.hypot(matrix.c, matrix.d),
        };
    }
    getBoneGameTransform(matrix, bone) {
        const { appliedPose } = bone;
        const xAxisX = matrix.a * appliedPose.a + matrix.c * appliedPose.c;
        const xAxisY = matrix.b * appliedPose.a + matrix.d * appliedPose.c;
        const yAxisX = matrix.a * appliedPose.b + matrix.c * appliedPose.d;
        const yAxisY = matrix.b * appliedPose.b + matrix.d * appliedPose.d;
        const determinant = xAxisX * yAxisY - yAxisX * xAxisY;
        const reflectionSign = determinant > 0 ? -1 : 1;
        return {
            x: matrix.a * appliedPose.worldX + matrix.c * appliedPose.worldY + matrix.tx,
            y: matrix.b * appliedPose.worldX + matrix.d * appliedPose.worldY + matrix.ty,
            xAxisX,
            xAxisY,
            yAxisX,
            yAxisY,
            reflectionSign,
        };
    }
    getBoneFollowerScaleRatio(scale, referenceScale) {
        return referenceScale === 0 ? 0 : scale / referenceScale;
    }
    normalizeDegrees(degrees) {
        return ((degrees + 180) % 360 + 360) % 360 - 180;
    }
    getBoneGameAngleDegrees(transform) {
        if (transform.xAxisX !== 0 || transform.xAxisY !== 0) {
            return Math.atan2(transform.xAxisY, transform.xAxisX) * spine.MathUtils.radDeg;
        }
        if (transform.yAxisX !== 0 || transform.yAxisY !== 0) {
            return Math.atan2(transform.yAxisY, transform.yAxisX) * spine.MathUtils.radDeg + transform.reflectionSign * 90;
        }
        return 0;
    }
    updateBoneFollowers(matrix) {
        if (this.boneFollowers.size === 0)
            return;
        const skeletonGameScale = this.getSkeletonGameScale(matrix);
        const staleFollowers = [];
        for (const [boneName, followers] of this.boneFollowers) {
            const bone = this.skeleton?.findBone(boneName);
            if (!bone)
                continue;
            const transform = this.getBoneGameTransform(matrix, bone);
            const boneGameAngleDegrees = this.getBoneGameAngleDegrees(transform);
            const offsetAngleSign = transform.reflectionSign;
            const boneWorldScaleX = bone.appliedPose.getWorldScaleX();
            const boneWorldScaleY = bone.appliedPose.getWorldScaleY();
            for (const follower of followers) {
                const instance = this.runtime.getInstanceByUid(follower.uid);
                if (!instance) {
                    staleFollowers.push({ uid: follower.uid, boneName });
                    continue;
                }
                const sx = this.getBoneFollowerScaleRatio(skeletonGameScale.scaleX, follower.refGameScaleX) * boneWorldScaleX;
                const sy = this.getBoneFollowerScaleRatio(skeletonGameScale.scaleY, follower.refGameScaleY) * boneWorldScaleY * transform.reflectionSign;
                const followerAngleDegrees = this.normalizeDegrees(boneGameAngleDegrees + follower.offsetAngle * offsetAngleSign);
                const followerAngleRad = followerAngleDegrees * spine.MathUtils.degRad;
                const followerAngleCos = Math.cos(followerAngleRad);
                const followerAngleSin = Math.sin(followerAngleRad);
                instance.x = transform.x + follower.offsetX * followerAngleCos - follower.offsetY * followerAngleSin * offsetAngleSign;
                instance.y = transform.y + follower.offsetX * followerAngleSin + follower.offsetY * followerAngleCos * offsetAngleSign;
                instance.angleDegrees = followerAngleDegrees;
                const width = follower.originalWidth * sx * follower.offsetScaleX;
                const height = follower.originalHeight * sy * follower.offsetScaleY;
                instance.setSize(width, height);
            }
        }
        for (const { uid, boneName } of staleFollowers)
            this.detachInstanceFromBoneByUid(uid, boneName);
    }
    updateBonesOverride() {
        for (const [bone, override] of this.bonesOverride) {
            this.updateBonePoseOnce(bone, override);
        }
    }
    updateBonePoseOnce(bone, boneOverride) {
        const { mode, x, y, rotation, scaleX, scaleY } = boneOverride;
        if (mode === "game") {
            if (x !== undefined || y !== undefined) {
                const locals = this.matrix.gameToBone(x ?? this.matrix.boneToGame(bone).x, y ?? this.matrix.boneToGame(bone).y, bone);
                bone.pose.x = locals.x;
                bone.pose.y = locals.y;
            }
            if (rotation !== undefined)
                bone.pose.rotation = this.matrix.gameToBoneRotation(rotation, bone);
        }
        if (mode === "local") {
            if (x !== undefined)
                bone.pose.x = x;
            if (y !== undefined)
                bone.pose.y = y;
            if (rotation !== undefined)
                bone.pose.rotation = rotation;
        }
        if (scaleX !== undefined)
            bone.pose.scaleX = scaleX;
        if (scaleY !== undefined)
            bone.pose.scaleY = scaleY;
    }
    /**********/
    /*
    *  Bone
    */
    getBoneX(boneName) {
        const { skeleton } = this;
        if (!skeleton) {
            console.warn('[Spine] getBoneX: no skeleton');
            return 0;
        }
        const bone = skeleton.findBone(boneName);
        if (!bone) {
            console.warn(`[Spine] getBoneX: bone not found: ${boneName}`);
            return 0;
        }
        const x = bone.appliedPose.worldX;
        const y = bone.appliedPose.worldY;
        const offsetX = this.x + this.propOffsetX;
        const offsetAngle = this.angle + this.propOffsetAngle;
        if (offsetAngle) {
            const cos = Math.cos(offsetAngle);
            const sin = Math.sin(offsetAngle);
            return x * cos - y * sin + offsetX;
        }
        return x + offsetX;
    }
    getBoneY(boneName) {
        const { skeleton } = this;
        if (!skeleton) {
            console.warn('[Spine] getBoneY: no skeleton');
            return 0;
        }
        const bone = skeleton.findBone(boneName);
        if (!bone) {
            console.warn(`[Spine] getBoneY: bone not found: ${boneName}`);
            return 0;
        }
        const x = bone.appliedPose.worldX;
        const y = bone.appliedPose.worldY;
        const offsetY = this.y + this.propOffsetY;
        const offsetAngle = this.angle + this.propOffsetAngle;
        if (offsetAngle) {
            const cos = Math.cos(offsetAngle);
            const sin = Math.sin(offsetAngle);
            return x * sin + y * cos + offsetY;
        }
        return y + offsetY;
    }
    getBoneRotation(boneName) {
        const { skeleton } = this;
        if (!skeleton) {
            console.warn('[Spine] getBoneRotation: no skeleton');
            return 0;
        }
        const bone = skeleton.findBone(boneName);
        if (!bone) {
            console.warn(`[Spine] getBoneRotation: bone not found: ${boneName}`);
            return 0;
        }
        const boneRotation = bone.appliedPose.getWorldRotationX();
        const offsetAngle = this.angle + this.propOffsetAngle;
        return boneRotation + (offsetAngle * 180 / Math.PI);
    }
    getBoneWorldX(boneName) {
        const { skeleton } = this;
        if (!skeleton) {
            console.warn('[Spine] getBoneWorldX: no skeleton');
            return 0;
        }
        const bone = skeleton.findBone(boneName);
        if (!bone) {
            console.warn(`[Spine] getBoneWorldX: bone not found: ${boneName}`);
            return 0;
        }
        const point = this.matrix.boneToGame(bone);
        return point.x;
    }
    getBoneWorldY(boneName) {
        const { skeleton } = this;
        if (!skeleton) {
            console.warn('[Spine] getBoneWorldY: no skeleton');
            return 0;
        }
        const bone = skeleton.findBone(boneName);
        if (!bone) {
            console.warn(`[Spine] getBoneWorldY: bone not found: ${boneName}`);
            return 0;
        }
        const point = this.matrix.boneToGame(bone);
        return point.y;
    }
    getBoneAppliedPose(boneName) {
        const { skeleton } = this;
        if (!skeleton) {
            console.warn('[Spine] getBoneAppliedPose: no skeleton');
            return undefined;
        }
        const bone = skeleton.findBone(boneName);
        if (!bone) {
            console.warn(`[Spine] getBoneAppliedPose: bone not found: ${boneName}`);
            return undefined;
        }
        return bone.appliedPose;
    }
    getBoneLocalX(boneName) {
        return this.getBoneAppliedPose(boneName)?.x ?? 0;
    }
    getBoneLocalY(boneName) {
        return this.getBoneAppliedPose(boneName)?.y ?? 0;
    }
    getBoneLocalRotation(boneName) {
        return this.getBoneAppliedPose(boneName)?.rotation ?? 0;
    }
    getBoneLocalScaleX(boneName) {
        return this.getBoneAppliedPose(boneName)?.scaleX ?? 0;
    }
    getBoneLocalScaleY(boneName) {
        return this.getBoneAppliedPose(boneName)?.scaleY ?? 0;
    }
    getBoneLocalShearX(boneName) {
        return this.getBoneAppliedPose(boneName)?.shearX ?? 0;
    }
    getBoneLocalShearY(boneName) {
        return this.getBoneAppliedPose(boneName)?.shearY ?? 0;
    }
    setBonePose(boneName, mode, applyMode, c3X, c3Y, c3Rotation, scaleX, scaleY) {
        const bone = this.getBone(boneName);
        if (!bone)
            return;
        if (applyMode === "hold") {
            const existing = this.bonesOverride.get(bone);
            this.bonesOverride.set(bone, {
                mode,
                x: c3X ?? existing?.x,
                y: c3Y ?? existing?.y,
                rotation: c3Rotation ?? existing?.rotation,
                scaleX: scaleX ?? existing?.scaleX,
                scaleY: scaleY ?? existing?.scaleY,
            });
        }
        else {
            this.updateBonePoseOnce(bone, { mode, x: c3X, y: c3Y, rotation: c3Rotation, scaleX, scaleY });
        }
    }
    releaseBoneHold(boneName, resetToSetup) {
        const bone = this.getBone(boneName);
        if (!bone)
            return;
        this.bonesOverride.delete(bone);
        if (resetToSetup)
            bone.setupPose();
    }
    setupPose(target) {
        const { skeleton } = this;
        if (!skeleton)
            return;
        if (target === 0)
            skeleton.setupPose();
        else if (target === 1)
            skeleton.setupPoseBones();
        else
            skeleton.setupPoseSlots();
    }
    setupBoneSlotPose(type, name) {
        if (type === "bone") {
            const bone = this.getBone(name);
            if (!bone)
                return;
            bone.setupPose();
        }
        else {
            const slot = this.getSlot(name);
            if (!slot)
                return;
            slot.setupPose();
        }
    }
    getBone(boneName) {
        if (boneName instanceof spine.Bone)
            return boneName;
        const { skeleton } = this;
        if (!skeleton)
            return;
        return skeleton.findBone(boneName);
    }
    /**********/
    /*
    *  Slot, attachments
    */
    getSlot(slotName) {
        if (slotName instanceof spine.Slot)
            return slotName;
        const { skeleton } = this;
        if (!skeleton)
            return;
        return skeleton.findSlot(slotName);
    }
    setAttachment(slotName, attachmentName) {
        this.skeleton?.setAttachment(slotName, attachmentName);
    }
    /**********/
    /*
    *  Skeleton
    */
    mirror(isMirrored) {
        if ((this.width < 0) !== isMirrored) {
            this.width = -this.width;
            this.updateMatrix();
            this.updateBoneFollowers(this.matrix);
        }
    }
    flip(isFlipped) {
        if ((this.height < 0) !== isFlipped) {
            this.height = -this.height;
            this.updateMatrix();
            this.updateBoneFollowers(this.matrix);
        }
    }
    setPhysicsMode(mode) {
        switch (mode) {
            case 0:
                this.physicsMode = spine.Physics.none;
                break;
            case 1:
                this.physicsMode = spine.Physics.reset;
                break;
            case 2:
                this.physicsMode = spine.Physics.update;
                break;
            case 3:
                this.physicsMode = spine.Physics.pose;
                break;
            default: console.warn('[Spine] Invalid physics mode:', mode);
        }
    }
    /**********/
    /*
    *  Bounds
    */
    setBounds(x, y, width, height) {
        if (width <= 0 || height <= 0) {
            console.warn('[Spine] setBounds: width and height must be positive');
            return;
        }
        const scaleX = (Math.abs(this.width) / this.spineBounds.width) * this.propScaleX;
        const scaleY = (Math.abs(this.height) / this.spineBounds.height) * this.propScaleY;
        this.spineBounds = { x, y, width, height };
        this.setOrigin(-x / width, 1 + y / height);
        this.width = width * scaleX * (this.width < 0 ? -1 : 1);
        this.height = height * scaleY * (this.height < 0 ? -1 : 1);
        this.propScaleX = 1;
        this.propScaleY = 1;
        this.updateCollisionSprite();
    }
    getBounds() {
        return { ...this.spineBounds };
    }
    setBoundsForSkinAnimation(skins, animation) {
        if (!this.skeleton || !this.state) {
            console.warn('[Spine] setBoundsForSkinAnimation: skeleton or state not loaded');
            return;
        }
        const boundsProvider = new spine.SkinsAndAnimationBoundsProvider(animation || undefined, skins);
        const bounds = boundsProvider.calculateBounds(this);
        if (bounds.width <= 0 || bounds.height <= 0) {
            console.warn('[Spine] setBoundsForSkinAnimation: calculated bounds have invalid dimensions');
            return;
        }
        const yUp = -(bounds.y + bounds.height);
        this.setBounds(bounds.x, yUp, bounds.width, bounds.height);
    }
    setBoundsForSetupPose() {
        if (!this.skeleton) {
            console.warn('[Spine] setBoundsForSetupPose: skeleton not loaded');
            return;
        }
        const boundsProvider = new spine.SetupPoseBoundsProvider();
        const bounds = boundsProvider.calculateBounds(this);
        if (bounds.width <= 0 || bounds.height <= 0) {
            console.warn('[Spine] setBoundsForSetupPose: calculated bounds have invalid dimensions');
            return;
        }
        const yUp = -(bounds.y + bounds.height);
        this.setBounds(bounds.x, yUp, bounds.width, bounds.height);
    }
}
;
C3.Plugins.EsotericSoftware_SpineConstruct3.Instance = SpineC3Instance;
export {};
