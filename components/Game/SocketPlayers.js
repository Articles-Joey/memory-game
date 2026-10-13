import { useGameStore } from "@/hooks/useGameStore";
import { Suspense } from "react";
import { useSocketStore } from "@/hooks/useSocketStore";
import { useSearchParams } from "next/navigation";

import { Model as SpacesuitModel } from "@/components/Models/Spacesuit";
import ModelToonCharacter from "@/components/Models/ModelToonCharacter";
import { useStore } from "@/hooks/useStore";
import { degToRad } from "three/src/math/MathUtils.js";

export default function SocketPlayers() {
    const toontownMode = useStore((state) => state.toontownMode);
    const players = useGameStore((state) => state.gameState.players);
    const socket = useGameStore((state) => state.socket);

    const searchParams = useSearchParams();
    const { server } = Object.fromEntries(searchParams.entries());

    return (
        <group>
            {players?.length > 0 &&
                players?.map((player, index) => {
                    if (player.id === socket?.id || player.id === "local")
                        return null;

                    return (
                        <group
                            key={index}
                            position={[0, -1, 0]}
                        >
                            <Suspense fallback={null}>
                                {toontownMode ? (
                                    <ModelToonCharacter
                                        position={[
                                            player?.position?.x || 0,
                                            (player?.position?.y ?? 0.45) + 0.8,
                                            player?.position?.z || 0,
                                        ]}
                                        action={player?.action || "Idle"}
                                        rotation={[
                                            player?.rotation?.[0] || 0,
                                            player?.rotation?.[1] || 0,
                                            player?.rotation?.[2] || 0,
                                        ]}
                                    />
                                ) : (
                                    <SpacesuitModel
                                        scale={3}
                                        // position={[0, -0.2, 0]}
                                        position={[
                                            player?.position?.x || 0,
                                            1.5,
                                            player?.position?.z || 0,
                                        ]}
                                        action={player?.action || "Idle"}
                                        rotation={[
                                            player?.rotation?.[0] || 0,
                                            player?.rotation?.[1] || 0,
                                            player?.rotation?.[2] || 0,
                                        ]}
                                    />
                                )}
                            </Suspense>

                            {/* <DummyPlayer
                        position={[player?.x || 0, 1.5, player?.z || 0]}
                        hitPower={player?.hitPower || 0}
                        hitRotation={player?.hitRotation || 0}
                        nickname={player?.nickname || "Player"}
                        socketId={socket?.id}
                        server={server}
                    /> */}
                        </group>
                    );
                })}
        </group>
    );
}
