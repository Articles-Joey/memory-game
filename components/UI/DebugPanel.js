import { useGameStore } from "@/hooks/useGameStore"
import { useMemo } from "react"
import ArticlesButton from "./Button"
import { useStore } from "@/hooks/useStore"

export default function DebugPanel() {

    const matchPairs = useGameStore(state => state.matchPairs)
    const timer = useGameStore(state => state.timer)
    const flipCount = useGameStore(state => state.flipCount)
    const generateMatchPairs = useGameStore(state => state.generateMatchPairs)
    const reloadScene = useStore(state => state.reloadScene)

    const flippedCards = useMemo(() => {
        let cards = matchPairs.filter(obj => obj.flipped)
        console.log(cards)
        return cards
    }, [matchPairs])

    return (
        <div
            className="card card-articles card-sm"
        >
            <div className="card-body">

                <div className="small text-muted">Debug Controls</div>

                <div className="border p-2">

                    <div className="small">Timer: {timer}</div>

                    <div className="small">Flip Count: {flipCount}</div>

                    <div className="small">Flipped:</div>

                    <div>
                        {flippedCards?.map(obj => {
                            return (
                                <span key={obj.flatLocation} className="badge bg-dark border border-black">
                                    {obj.flatLocation}
                                </span>
                            )
                        })}
                    </div>

                </div>

                <div className="small border p-2">

                    {/* TODO - Move to DebugPanel */}
                    <ArticlesButton
                        size="sm"
                        className="w-50"
                        onClick={reloadScene}
                    >
                        <i className="fad fa-redo"></i>
                        Reload Game
                    </ArticlesButton>

                    <ArticlesButton
                        small
                        className="w-100"
                        onClick={() => {
                            console.log(matchPairs)
                        }}
                    >
                        Log Match Pairs
                    </ArticlesButton>

                    <ArticlesButton
                        small
                        className="w-100"
                        onClick={() => {
                            generateMatchPairs(4, 8)
                        }}
                    >
                        Generate New Match Pairs
                    </ArticlesButton>

                </div>

            </div>
        </div>
    )

}