import { memo, useMemo } from "react";

import Link from "next/link";

// import ROUTES from '@/components/constants/routes';

import ArticlesButton from "@/components/UI/Button";

import { useSocketStore } from "@/hooks/useSocketStore";
import { useGameStore } from "@/hooks/useGameStore";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { useStore } from "@/hooks/useStore";

function LeftPanelContent(props) {

    const {
        isFullscreen,
        requestFullscreen,
        exitFullscreen,
        reloadScene
    } = props;

    // const {
    //     socket,
    // } = useSocketStore(state => ({
    //     socket: state.socket,
    // }));

    const {
        matchPairs,
        setMatchPairs,
        generateMatchPairs,
        flipCount,
        cameraMode,
        debug,
        setDebug,
        timer
    } = useGameStore(state => ({
        matchPairs: state.matchPairs,
        setMatchPairs: state.setMatchPairs,
        generateMatchPairs: state.generateMatchPairs,
        flipCount: state.flipCount,
        cameraMode: state.cameraMode,
        debug: state.debug,
        setDebug: state.setDebug,
        timer: state.timer
    }));

    const darkMode = useStore(state => state.darkMode);
    const toggleDarkMode = useStore(state => state.toggleDarkMode);

    const sidebar = useStore(state => state.sidebar);
    const toggleSidebar = useStore(state => state.toggleSidebar);

    const flippedCards = useMemo(() => {
        let cards = matchPairs.filter(obj => obj.flipped)
        console.log(cards)
        return cards
    }, [matchPairs])

    return (
        <div className='w-100'>

            <div className="card card-articles card-sm">

                <div className="card-body d-flex flex-wrap">

                    <Link
                        href={"/"}
                        className="w-50"
                    >
                        <ArticlesButton
                            className='w-100'
                            small
                        >
                            <i className="fad fa-arrow-alt-square-left"></i>
                            <span>Leave Game</span>
                        </ArticlesButton>
                    </Link>

                    <ArticlesButton
                        small
                        className="w-50"
                        active={isFullscreen}
                        onClick={() => {
                            if (isFullscreen) {
                                exitFullscreen()
                            } else {
                                requestFullscreen('memory-game-game-page')
                            }
                        }}
                    >
                        {isFullscreen && <span>Exit </span>}
                        {!isFullscreen && <span><i className='fad fa-expand'></i></span>}
                        <span>Fullscreen</span>
                    </ArticlesButton>

                    <ArticlesButton
                        size="sm"
                        className="w-50"
                        active={sidebar}
                        onClick={() => toggleSidebar()}
                    >
                        <i className="fad fa-bars"></i>
                        Sidebar
                    </ArticlesButton>

                    <ArticlesButton
                        size="sm"
                        className="w-50"
                        onClick={reloadScene}
                    >
                        <i className="fad fa-redo"></i>
                        Reload Game
                    </ArticlesButton>

                    <div className='w-50 d-flex'>
                        <ArticlesButton
                            // ref={el => elementsRef.current[4] = el}
                            // active={activeIndex === 3}
                            className={`w-100 flex-grow-1`}
                            small
                            onClick={() => {
                                setShowSettingsModal(true)
                            }}
                        >
                            <i className="fad fa-cog"></i>
                            Settings
                        </ArticlesButton>
                        <ArticlesButton
                            // ref={el => elementsRef.current[4] = el}
                            // active={activeIndex === 3}
                            className={`flex-grow-0`}
                            small
                            onClick={() => {
                                toggleDarkMode()
                            }}
                        >
                            {darkMode ? <i className="fad fa-moon"></i> : <i className="fad fa-sun"></i>}
                            {/* <i className="fad fa-sun"></i> */}
                        </ArticlesButton>
                    </div>

                    <div className="w-50">
                        <DropdownButton
                            variant="articles w-100"
                            size='sm'
                            disabled
                            id="dropdown-basic-button"
                            className="dropdown-articles"
                            title={
                                <span>
                                    <i className="fad fa-camera"></i>
                                    <span>Camera</span>
                                </span>
                            }
                        >

                            <div style={{ maxHeight: '600px', overflowY: 'auto', width: '200px' }}>

                                {[
                                    {
                                        name: 'Free',
                                    },
                                    {
                                        name: 'Player',
                                    }
                                ]
                                    .map(location =>
                                        <Dropdown.Item
                                            key={location.name}
                                            active={cameraMode == location.name}
                                            onClick={() => {
                                                setCameraMode(location.name)
                                                setShowMenu(false)
                                            }}
                                            className="d-flex justify-content-between"
                                        >
                                            <i className="fad fa-camera"></i>
                                            {location.name}
                                        </Dropdown.Item>
                                    )}

                            </div>

                        </DropdownButton>
                    </div>

                    <div className='w-50'>
                        <DropdownButton
                            variant="articles w-100"
                            size='sm'
                            id="dropdown-basic-button"
                            className="dropdown-articles"
                            title={
                                <span>
                                    <i className="fad fa-bug"></i>
                                    <span>Debug </span>
                                    <span>{debug ? 'On' : 'Off'}</span>
                                </span>
                            }
                        >

                            <div style={{ maxHeight: '600px', overflowY: 'auto', width: '200px' }}>

                                {[
                                    false,
                                    true
                                ]
                                    .map(location =>
                                        <Dropdown.Item
                                            key={location}
                                            onClick={() => {
                                                setDebug(location)
                                                reloadScene()
                                            }}
                                            className="d-flex justify-content-between"
                                        >
                                            {location ? 'True' : 'False'}
                                        </Dropdown.Item>
                                    )}

                            </div>

                        </DropdownButton>
                    </div>

                </div>

            </div>

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

        </div>
    )

}

export default memo(LeftPanelContent)