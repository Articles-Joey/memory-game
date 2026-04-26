import { useEffect, useState } from "react";

import Image from "next/image";
import dynamic from 'next/dynamic'

// import { useSelector } from 'react-redux'

import { Modal } from "react-bootstrap"

import ViewUserModal from "@/components/UI/ViewUserModal"

// import BasicLoading from "@/components/loading/BasicLoading";

// import powerups from "app/(site)/community/games/four-frogs/components/powerups";

// import games from "../constants/games";
const games = []

import IsDev from "@/components/UI/IsDev";
import ArticlesButton from "./Button";
import { useStore } from "@/hooks/useStore";

const registeredGames = [
    'Four Frogs',
    'Race Game',
    'Eager Eagle',
    'Plinko',
    'Battle Trap',
    'Blackjack',
    'Ping Pong',
    'Tower Blocks',
    'Assets Gallery',
    'Tic Tac Toe',
    'Ocean Rings',
    'Maze',
    'School Run'
]

export default function GameInfoModal({
    show,
    setShow,
    credits
}) {

    const darkMode = useStore(state => state.darkMode)

    const [showModal, setShowModal] = useState(true)

    const [lightboxData, setLightboxData] = useState(null)

    // const userReduxState = useSelector((state) => state.auth.user_details);
    const userReduxState = false

    const [showVideo, setShowVideo] = useState()

    useEffect(() => {

        if (!show.item) {
            setShow({
                ...show,
                item: games.find(game_obj => game_obj.name == show.game)
            })
        }

    }, [])

    return (
        <>
            {/* {lightboxData && (
                <Lightbox
                    mainSrc={lightboxData?.location}
                    onCloseRequest={() => setLightboxData(null)}
                    reactModalStyle={{
                        overlay: {
                            zIndex: '2000'
                        }
                    }}
                />
            )} */}

            <Modal
                className="articles-modal games-info-modal"
                size='md'
                show={showModal}
                centered
                scrollable
                onExited={() => {
                    setShow(false)
                }}
                onHide={() => {
                    setShowModal(false)
                }}
            >

                <Modal.Header closeButton>
                    <Modal.Title>Memory Game Info</Modal.Title>
                </Modal.Header>

                <Modal.Body className="flex-column p-0">

                    <div className="ratio ratio-16x9">
                        {darkMode ?
                            <img src={"img/dark-preview.webp"}></img>
                            :
                            <img src={"img/preview.webp"}></img>
                        }
                    </div>

                    <div className="p-3">

                        Match cards as fast as you can! The game ends when all pairs are found. Try to beat your best time.

                    </div>

                </Modal.Body>

                <Modal.Footer className="justify-content-between">

                    <div></div>

                    <ArticlesButton variant="outline-dark" onClick={() => {
                        setShow(false)
                    }}>
                        Close
                    </ArticlesButton>

                </Modal.Footer>

            </Modal>
        </>
    )

}