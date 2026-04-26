import { useGameStore } from "@/hooks/useGameStore"
import { useSocketStore } from "@/hooks/useSocketStore"
import { useSearchParams } from "next/navigation"

import { Model as SpacesuitModel } from "@/components/Models/Spacesuit";
import { degToRad } from "three/src/math/MathUtils.js";

export default function SocketPlayers() {

    const players = useGameStore(state => state.gameState.players)
    const socket = useGameStore(state => state.socket)

    const searchParams = useSearchParams()
    const { server } = Object.fromEntries(searchParams.entries())

    return (
        <group>
            {players?.length > 0 && players?.map((player, index) => (
                <group key={index} position={[0, 5, 0]}>

                    <SpacesuitModel
                        scale={3}
                        // position={[0, -0.2, 0]}
                        position={[player?.x || 0, 1.5, player?.z || 0]}
                        action={player?.action || "Idle"}
                        rotation={[
                            player?.rotation?.[0] || 0, 
                            player?.rotation?.[1] || 0,
                            player?.rotation?.[2] || 0,
                        ]}
                    />

                    {/* <DummyPlayer 
                        position={[player?.x || 0, 1.5, player?.z || 0]}
                        hitPower={player?.hitPower || 0}
                        hitRotation={player?.hitRotation || 0}
                        nickname={player?.nickname || "Player"}
                        socketId={socket?.id}
                        server={server}
                    /> */}

                </group>
            ))}
        </group>
    )

}