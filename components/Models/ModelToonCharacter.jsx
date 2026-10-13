// Adapted from fishing/components/Models/MostRecent.jsx.
import { useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { AnimationUtils, LoopOnce, LoopRepeat } from "three";
import { SkeletonUtils } from "three-stdlib";

const MODEL_URL = "/models/toontown/MostRecent-transformed.glb";
const CLIP_PREFIX = "medium_shorts_toon_rig|";
const GAME_ACTIONS = {
    Idle: "neutral",
    Walk: "walk",
    Run: "run",
    Jump: "leap_z",
};
const trimmedClipCache = new WeakMap();

function prepareAnimation(action, oneShot) {
    action.reset();
    action.setEffectiveTimeScale(oneShot ? action.getClip().duration : 1);
    action.setLoop(oneShot ? LoopOnce : LoopRepeat, oneShot ? 1 : Infinity);
    action.clampWhenFinished = oneShot;
}

function setCharacterBrightness(materials, brightness) {
    for (const material of materials) {
        if (!material.emissive) continue;
        material.emissive.copy(material.color);
        material.emissiveMap = material.map;
        material.emissiveIntensity = Math.max(0, brightness);
        material.needsUpdate = true;
    }
}

function getTrimmedClips(animations) {
    if (!trimmedClipCache.has(animations)) {
        // Skip the source rig's first frame. Share these immutable clips across
        // avatars; each avatar still has its own skeleton, mixer and actions.
        trimmedClipCache.set(
            animations,
            animations.map((clip) => {
                const lastFrame = Math.floor(clip.duration * 30);
                return lastFrame > 1
                    ? AnimationUtils.subclip(clip, clip.name, 1, lastFrame, 30)
                    : clip;
            }),
        );
    }
    return trimmedClipCache.get(animations);
}

export function ModelToonCharacter({
    action = "Idle",
    isWalking = false,
    isSprinting = false,
    isJumping = false,
    isSwimming = false,
    isFishing = false,
    scale = 0.01,
    brightness = 0.15,
    ...props
}) {
    const group = useRef();
    const previousAction = useRef();
    const { scene, animations } = useGLTF(MODEL_URL);
    const { clone, ownedMaterials } = useMemo(() => {
        const clone = SkeletonUtils.clone(scene);
        const materialCopies = new Map();
        const copyMaterial = (source) => {
            if (!materialCopies.has(source)) {
                const material = source.clone();
                if (material.name === "atlas2") {
                    material.transparent = false;
                    material.depthWrite = true;
                    material.alphaTest = 0.5;
                }
                materialCopies.set(source, material);
            }
            return materialCopies.get(source);
        };
        clone.traverse((object) => {
            if (!object.isMesh) return;
            object.castShadow = true;
            object.receiveShadow = true;
            object.material = Array.isArray(object.material)
                ? object.material.map(copyMaterial)
                : copyMaterial(object.material);
        });
        return { clone, ownedMaterials: [...materialCopies.values()] };
    }, [scene]);
    const clips = useMemo(() => getTrimmedClips(animations), [animations]);
    const { actions } = useAnimations(clips, group);
    const requestedClip = isFishing
        ? "fish"
        : isSwimming
          ? "swim"
          : isJumping
            ? "leap_z"
            : isSprinting
              ? "run"
              : isWalking
                ? "walk"
                : GAME_ACTIONS[action] || action;
    const animationName = requestedClip.startsWith(CLIP_PREFIX)
        ? requestedClip
        : `${CLIP_PREFIX}${requestedClip}`;

    useEffect(() => {
        setCharacterBrightness(ownedMaterials, brightness);
    }, [ownedMaterials, brightness]);

    useEffect(
        () => () => {
            ownedMaterials.forEach((material) => material.dispose());
        },
        [ownedMaterials],
    );

    useEffect(() => {
        const next = actions[animationName] || actions[`${CLIP_PREFIX}neutral`];
        if (!next) return;
        const previous = previousAction.current;
        const oneShot = next.getClip().name === `${CLIP_PREFIX}leap_z`;
        prepareAnimation(next, oneShot);
        if (previous && previous !== next) previous.fadeOut(0.2);
        next.fadeIn(0.2).play();
        previousAction.current = next;
        return () => next.fadeOut(0.2);
    }, [actions, animationName]);

    return (
        <group
            ref={group}
            {...props}
            scale={scale}
            dispose={null}
        >
            <primitive object={clone} />
        </group>
    );
}

export default ModelToonCharacter;
