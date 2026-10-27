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
C3.Plugins.EsotericSoftware_SpineConstruct3.Exps =
    {
        SlotAttachment(slotName) {
            const { skeleton } = this;
            if (!skeleton)
                return "";
            const slot = skeleton.findSlot(slotName);
            if (!slot)
                return "";
            const attachment = slot.pose.getAttachment();
            return attachment ? attachment.name : "";
        },
        SlotAttachmentPlaceholder(slotName) {
            const { skeleton } = this;
            if (!skeleton)
                return "";
            const slot = skeleton.findSlot(slotName);
            if (!slot)
                return "";
            const attachment = slot.pose.getAttachment();
            if (!attachment)
                return "";
            const slotIndex = slot.data.index;
            const skin = skeleton.skin;
            if (skin) {
                const name = findPlaceholderName(skin, slotIndex, attachment);
                if (name)
                    return name;
            }
            const defaultSkin = skeleton.data.defaultSkin;
            if (defaultSkin) {
                const name = findPlaceholderName(defaultSkin, slotIndex, attachment);
                if (name)
                    return name;
            }
            return attachment.name;
        },
        BoneX(boneName) {
            return this.getBoneX(boneName);
        },
        BoneY(boneName) {
            return this.getBoneY(boneName);
        },
        BoneRotation(boneName) {
            return this.getBoneRotation(boneName);
        },
        BoneLength(boneName) {
            const { skeleton } = this;
            if (!skeleton)
                return 0;
            const bone = skeleton.findBone(boneName);
            if (!bone)
                return 0;
            return bone.data.length;
        },
        BoneWorldX(boneName) {
            return this.getBoneWorldX(boneName);
        },
        BoneWorldY(boneName) {
            return this.getBoneWorldY(boneName);
        },
        BoneLocalX(boneName) {
            return this.getBoneLocalX(boneName);
        },
        BoneLocalY(boneName) {
            return this.getBoneLocalY(boneName);
        },
        BoneLocalRotation(boneName) {
            return this.getBoneLocalRotation(boneName);
        },
        BoneLocalScaleX(boneName) {
            return this.getBoneLocalScaleX(boneName);
        },
        BoneLocalScaleY(boneName) {
            return this.getBoneLocalScaleY(boneName);
        },
        BoneLocalShearX(boneName) {
            return this.getBoneLocalShearX(boneName);
        },
        BoneLocalShearY(boneName) {
            return this.getBoneLocalShearY(boneName);
        },
        CurrentSkin() {
            return this.getCurrentSkin();
        },
        Animations() {
            return this.getAnimations();
        },
        AnimationsCount() {
            return this.getAnimationsCount();
        },
        AnimationName(index) {
            return this.getAnimationName(index);
        },
        CurrentAnimation(trackIndex) {
            return this.getCurrentAnimation(trackIndex);
        },
        GetEventData(field) {
            if (field === "float")
                return this.triggeredEventData?.floatValue ?? 0;
            if (field === "int")
                return this.triggeredEventData?.intValue ?? 0;
            if (field === "string")
                return this.triggeredEventData?.stringValue ?? "";
            if (field === "balance")
                return this.triggeredEventData?.balance ?? 0;
            if (field === "volume")
                return this.triggeredEventData?.volume ?? 0;
            if (field === "audiopath")
                return this.triggeredEventData?.data.audioPath ?? "";
            if (field === "event")
                return this.triggeredEventData?.data.name ?? "";
            if (field === "animation")
                return this.triggeredEventAnimation;
            if (field === "track")
                return this.triggeredEventTrack;
            return "";
        },
        TimeScale(track) {
            if (!this.state)
                return 1;
            if (track < 0)
                return this.state.timeScale;
            const entry = this.state.getTrack(track);
            return entry?.timeScale ?? 1;
        },
        Loop(track) {
            if (!this.state)
                return 0;
            const entry = this.state.getTrack(track);
            return entry?.loop ? 1 : 0;
        },
        CurrentAnimationStart(trackIndex) {
            const track = this.state?.getTrack(trackIndex);
            return track?.animationStart ?? 0;
        },
        CurrentAnimationEnd(trackIndex) {
            const track = this.state?.getTrack(trackIndex);
            return track?.animationEnd ?? 0;
        },
        CurrentAnimationLast(trackIndex) {
            const track = this.state?.getTrack(trackIndex);
            return track?.animationLast ?? 0;
        },
        BoundsX() {
            return this.getBounds().x;
        },
        BoundsY() {
            return this.getBounds().y;
        },
        BoundsWidth() {
            return this.getBounds().width;
        },
        BoundsHeight() {
            return this.getBounds().height;
        },
        CollisionBodyUID() {
            return this.getCollisionBodyUid();
        },
        BoundingBoxPointCount(slotName, attachmentName) {
            return this.getBoundingBoxPointCount(slotName, attachmentName);
        },
        BoundingBoxPointX(slotName, attachmentName, index) {
            return this.getBoundingBoxPointX(slotName, attachmentName, index);
        },
        BoundingBoxPointY(slotName, attachmentName, index) {
            return this.getBoundingBoxPointY(slotName, attachmentName, index);
        },
        BoundingBoxCenterX(slotName, attachmentName) {
            return this.getBoundingBoxCenterX(slotName, attachmentName);
        },
        BoundingBoxCenterY(slotName, attachmentName) {
            return this.getBoundingBoxCenterY(slotName, attachmentName);
        },
        BoundingBoxLeft(slotName, attachmentName) {
            return this.getBoundingBoxLeft(slotName, attachmentName);
        },
        BoundingBoxTop(slotName, attachmentName) {
            return this.getBoundingBoxTop(slotName, attachmentName);
        },
        BoundingBoxRight(slotName, attachmentName) {
            return this.getBoundingBoxRight(slotName, attachmentName);
        },
        BoundingBoxBottom(slotName, attachmentName) {
            return this.getBoundingBoxBottom(slotName, attachmentName);
        },
        BoundingBoxPolygonJson(slotName, attachmentName) {
            return this.getBoundingBoxPolygonJson(slotName, attachmentName);
        }
    };
function findPlaceholderName(skin, slotIndex, attachment) {
    const dictionary = skin.attachments[slotIndex];
    if (!dictionary)
        return null;
    for (const name in dictionary) {
        if (dictionary[name] === attachment)
            return name;
    }
    return null;
}
export {};
