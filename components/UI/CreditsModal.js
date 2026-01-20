import { useEffect, useState, useRef } from "react";

import Image from "next/image";
import dynamic from 'next/dynamic'

// import { useSelector } from 'react-redux'

import { Modal } from "react-bootstrap";

import ArticlesButton from "./Button";
import Link from "next/link";
import { useModalNavigation } from "@/hooks/useModalNavigation";

// import { B } from "@articles-media/articles-gamepad-helper/XboxIcons";
import B from "@articles-media/articles-gamepad-helper/dist/img/Xbox UI/B.svg";
// import B from "@articles-media/articles-gamepad-helper/public/img/Xbox UI/B.svg";

export default function CreditsModal({
    show,
    setShow,
}) {

    const [showModal, setShowModal] = useState(true)

    const elementsRef = useRef([]);
    useModalNavigation(elementsRef, () => setShowModal(false));

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
                    <Modal.Title>Game Credits</Modal.Title>
                </Modal.Header>

                <Modal.Body className="flex-column p-3">

                    <h6 className="mb-2">
                        Developer: Articles Joey
                    </h6>

                    <Link href="https://github.com/Articles-Joey/platformer-escape" target="_blank" rel="noopener noreferrer">
                        <ArticlesButton
                            ref={el => elementsRef.current[0] = el}
                            size=""
                            className="mb-4"
                        >
                            <i className="fab fa-github me-2"></i>
                            <span>View on Github</span>
                        </ArticlesButton>
                    </Link>

                    <h6 className="mb-2">
                        Publisher: Articles Media
                    </h6>

                    <Link href="https://github.com/Articles-Media" target="_blank" rel="noopener noreferrer">
                        <ArticlesButton
                            ref={el => elementsRef.current[1] = el}
                            size=""
                            className="mb-4"
                        >
                            <i className="fad fa-browser me-2"></i>
                            <span>View Website</span>
                        </ArticlesButton>
                    </Link>

                    <h6 className="mb-2">
                        Attributions
                    </h6>

                    <Link href="https://github.com/Articles-Joey/platformer-escape/blob/main/README.md#attributions" target="_blank" rel="noopener noreferrer">
                        <ArticlesButton
                            ref={el => elementsRef.current[2] = el}
                            size=""
                            className=""
                        >
                            <i className="fab fa-github me-2"></i>
                            <span>View on Github</span>
                        </ArticlesButton>
                    </Link>

                </Modal.Body>

                <Modal.Footer className="justify-content-between">

                    <div></div>

                    <ArticlesButton
                        ref={el => elementsRef.current[3] = el}
                        variant="outline-dark"
                        onClick={() => {
                            setShow(false)
                        }}
                        className="d-flex align-items-center"
                    >
                        <img src={B.src} className="me-1" alt="Close" />
                        Close
                    </ArticlesButton>

                </Modal.Footer>

            </Modal>
        </>
    )

}