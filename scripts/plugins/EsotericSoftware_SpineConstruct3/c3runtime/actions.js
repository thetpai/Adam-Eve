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
C3.Plugins.EsotericSoftware_SpineConstruct3.Acts =
    {
        SetSkin(skinList) {
            this.setSkin(skinList === "" ? [] : skinList.split(","));
        },
        Mirror(isMirrored) {
            this.mirror(isMirrored);
        },
        Flip(isFlipped) {
            this.flip(isFlipped);
        },
        SetAnimation(track, animation, loop = false, additive = 0) {
            this.setAnimation(track, animation, loop, additive === 1);
        },
        AddAnimation(track, animation, loop = false, delay = 0, additive = 0) {
            this.addAnimation(track, animation, loop, delay, additive === 1);
        },
        Play() {
            this.play();
        },
        Stop() {
            this.stop();
        },
        AddEmptyAnimation(track, mixDuration, delay) {
            this.addEmptyAnimation(track, mixDuration, delay);
        },
        SetEmptyAnimation(track, mixDuration) {
            this.setEmptyAnimation(track, mixDuration);
        },
        SetAttachment(slotName, attachmentName) {
            this.setAttachment(slotName, attachmentName === "" ? null : attachmentName);
        },
        CreateCustomSkin(skinName) {
            this.createCustomSkin(skinName);
        },
        AddCustomSkin(customSkinName, skinToAddName) {
            this.addCustomSkin(customSkinName, skinToAddName);
        },
        SetCustomSkin(skinName) {
            this.setCustomSkin(skinName);
        },
        SetTimeScale(track, timeScale) {
            this.setTimeScale(track, timeScale);
        },
        SetAnimationTime(track, time, units) {
            this.setAnimationTime(units, time, track);
        },
        SetAnimationMix(fromName, toName, duration) {
            this.setAnimationMix(fromName, toName, duration);
        },
        SetDefaultMix(duration) {
            this.setDefaultMix(duration);
        },
        SetPhysicsMode(mode) {
            this.setPhysicsMode(mode);
        },
        SetSkeletonColor(color) {
            this.setSkeletonColor(color);
        },
        SetTrackAlpha(alpha, trackIndex) {
            this.setTrackAlpha(alpha, trackIndex);
        },
        ClearTrack(trackIndex) {
            this.clearTrack(trackIndex);
        },
        SetSlotColor(slotName, color) {
            this.setSlotColor(slotName, color);
        },
        ResetSlotColors(slotName) {
            this.resetSlotColors(slotName);
        },
        SetBonePose(boneName, mode, applyMode, x, y, rotation, scaleX, scaleY) {
            this.setBonePose(boneName, mode === 0 ? "local" : "game", applyMode === 0 ? "once" : "hold", toNumberOrUndefined(x), toNumberOrUndefined(y), toNumberOrUndefined(rotation), toNumberOrUndefined(scaleX), toNumberOrUndefined(scaleY));
        },
        ReleaseBoneHold(boneName, resetToSetup) {
            this.releaseBoneHold(boneName, resetToSetup);
        },
        SetupPose(target) {
            this.setupPose(target);
        },
        SetupBoneSlotPose(type, name) {
            this.setupBoneSlotPose(type === 0 ? "bone" : "slot", name);
        },
        AttachInstanceToBone(uid, boneName, offsetX, offsetY, offsetAngle, offsetScaleX = 1, offsetScaleY = 1) {
            this.attachInstanceToBone(uid, boneName, offsetX, offsetY, offsetAngle, offsetScaleX, offsetScaleY);
        },
        AttachObjectToBone(objectClass, boneName, offsetX, offsetY, offsetAngle, offsetScaleX = 1, offsetScaleY = 1) {
            const pickedInstances = objectClass.getPickedInstances();
            for (const instance of pickedInstances) {
                this.attachInstanceToBone(instance.uid, boneName, offsetX, offsetY, offsetAngle, offsetScaleX, offsetScaleY);
            }
        },
        DetachObjectFromBone(objectClass, boneName) {
            const pickedInstances = objectClass.getPickedInstances();
            for (const instance of pickedInstances) {
                this.detachInstanceFromBoneByUid(instance.uid, boneName);
            }
        },
        DetachAllFromBone(boneName) {
            this.detachAllFromBone(boneName);
        },
        AddHandle(type, name, radius, debug) {
            this.addDragHandle(type, name, radius, debug);
        },
        RemoveHandle(type, name) {
            this.removeDragHandle(type, name);
        },
        SetCollisionBoundingBox(slotName, attachmentName) {
            this.setCollisionBoundingBox(slotName, attachmentName);
        },
        ClearCollisionBoundingBox() {
            this.clearCollisionBoundingBox();
        },
        SetCollisionBoundingBoxDebug(enabled) {
            this.setCollisionBoundingBoxDebug(enabled);
        },
        SetCollisionBodyDrivesObject(enabled) {
            this.setCollisionBodyDrivesObject(enabled);
        },
        SetRuntimeAssetCacheRetainedWhenUnused(enabled, scope) {
            this.setRuntimeAssetCacheRetainedWhenUnused(enabled, scope === 0 ? "object-type" : "all");
        },
        ReleaseCachedSpineAssets() {
            this.releaseCachedSpineAssets();
        },
        ReleaseAllCachedSpineAssets() {
            this.releaseAllCachedSpineAssets();
        },
        SetBounds(x, y, width, height) {
            this.setBounds(x, y, width, height);
        },
        SetBoundsForSkinAnimation(skins, animation) {
            this.setBoundsForSkinAnimation(skins === "" ? [] : skins.split(","), animation);
        },
        SetBoundsForSetupPose() {
            this.setBoundsForSetupPose();
        }
    };
function toNumberOrUndefined(x) {
    if (typeof x === "number") {
        return Number.isFinite(x) ? x : undefined;
    }
    if (typeof x === "string") {
        const trimmed = x.trim();
        if (trimmed === "")
            return undefined;
        const n = Number(trimmed);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}
export {};
