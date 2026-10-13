import { Physics } from "@react-three/rapier";

// Rapier exposes its collider debugger through Physics rather than a Debug export.
export default function Debug({ debug, children }) {
    return (
        <Physics
            colliders={false}
            debug={debug}
        >
            {children}
        </Physics>
    );
}
