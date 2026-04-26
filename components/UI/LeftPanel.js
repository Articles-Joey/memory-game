import { memo, useMemo } from "react";

import Link from "next/link";

// import ROUTES from '@/components/constants/routes';

import ArticlesButton from "@/components/UI/Button";

import { useSocketStore } from "@/hooks/useSocketStore";
import { useGameStore } from "@/hooks/useGameStore";
import { Dropdown, DropdownButton } from "react-bootstrap";
import { useStore } from "@/hooks/useStore";

import useFullscreen from '@articles-media/articles-dev-box/useFullscreen';
import DebugPanel from "./DebugPanel";
import GameDetailsPanel from "./GameDetailsPanel";

function LeftPanelContent(props) {

    const {
        reloadScene
    } = props;

    const { isFullscreen, requestFullscreen, exitFullscreen } = useFullscreen();

    const setShowSettingsModal = useStore((state) => state.setShowSettingsModal)

    // const {
    //     socket,
    // } = useSocketStore(state => ({
    //     socket: state.socket,
    // }));

    const cameraMode = useGameStore(state => state.cameraMode)
    const setCameraMode = useGameStore(state => state.setCameraMode)
    
    const debug = useStore(state => state.debug)
    const setDebug = useStore(state => state.setDebug)

    const darkMode = useStore(state => state.darkMode);
    const toggleDarkMode = useStore(state => state.toggleDarkMode);

    const sidebar = useStore(state => state.sidebar);
    const toggleSidebar = useStore(state => state.toggleSidebar);

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
                                requestFullscreen()
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

            <GameDetailsPanel />

            {debug &&
                <DebugPanel />
            }

        </div>
    )

}

export default memo(LeftPanelContent)