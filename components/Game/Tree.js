import { useGLTF } from "@react-three/drei";
import { getTreeResources } from "./treeResources";

const TREE_MODEL = "/models/Tree-transformed.glb";

export default function Tree(props) {
    const { nodes } = useGLTF(TREE_MODEL);
    const { trunk, foliage, barkMaterial, foliageMaterial } = getTreeResources(
        nodes["tree-spruce"].geometry,
    );

    // Resources are shared with every tree using this cached GLTF geometry.
    return (
        <group
            {...props}
            dispose={null}
        >
            <mesh
                castShadow
                receiveShadow
                name="tree-trunk"
                userData={{ cameraObstacle: true }}
                geometry={trunk}
                material={barkMaterial}
            />
            <mesh
                name="tree-foliage"
                userData={{ cameraObstacle: true }}
                castShadow
                receiveShadow
                geometry={foliage}
                material={foliageMaterial}
            />
        </group>
    );
}

useGLTF.preload(TREE_MODEL);
