import Link from "next/link";

// import ROUTES from '@/components/constants/routes';
// import { useGameStore } from "../hooks/useGameStore";
import ArticlesButton from "@/components/UI/Button";

// import ControllerPreview from "../../ControllerPreview";

import { useSocketStore } from "@/hooks/useSocketStore";
import { useIceSlideStore } from "@/hooks/useIceSlideStore";
import { useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export default function LeftPanelContent(props) {

    const {
        server,
        // players,
        touchControlsEnabled,
        setTouchControlsEnabled,
        reloadScene,
        controllerState,
        isFullscreen,
        requestFullscreen,
        exitFullscreen,
        setShowMenu
    } = props;

    const {
        hitRotation,
        setHitRotation,
        hitPower,
        setHitPower
    } = useIceSlideStore(state => ({
        hitRotation: state.hitRotation,
        setHitRotation: state.setHitRotation,
        hitPower: state.hitPower,
        setHitPower: state.setHitPower,
    }));

    const {
        socket,
    } = useSocketStore(state => ({
        socket: state.socket,
    }));

    const hitRotationRef = useRef(hitRotation);
    useEffect(() => {
        hitRotationRef.current = hitRotation;
    }, [hitRotation]);

    useHotkeys(['Right'], () => {
        console.log("test", hitRotationRef.current)
        if (hitRotationRef.current >= 360) {
            setHitRotation(0)
            return
        }
        setHitRotation(hitRotationRef.current + 1)
    });
    useHotkeys(['Left'], () => {
        console.log("test", hitRotationRef.current)
        if (hitRotationRef.current <= 0) {
            setHitRotation(360)
            return
        }
        setHitRotation(hitRotationRef.current - 1)
    });

    const hitPowerRef = useRef(hitPower);
    useEffect(() => {
        hitPowerRef.current = hitPower;
    }, [hitPower]);

    useHotkeys(['Up'], () => {
        // console.log("test", hitPowerRef.current)
        if (hitPowerRef.current >= 100) {
            return
        }
        setHitPower(hitPowerRef.current + 1)
    });
    useHotkeys(['Down'], () => {
        // console.log("test", hitPowerRef.current)
        if (hitPowerRef.current <= 0) {
            return
        }
        setHitPower(hitPowerRef.current - 1)
    });
    
    useHotkeys(['Enter'], () => {
        console.log("Launch?")
    });

    return (
        <div className='w-100'>

            <div className="card card-articles card-sm">

                <div className="card-body">

                    <div className='flex-header'>
                        <div>Server: {server}</div>
                        <div>Players: {0}/4</div>
                    </div>

                    {!socket?.connected &&
                        <div
                            className=""
                        >

                            <div className="">

                                <div className="h6 mb-1">Not connected</div>

                                <ArticlesButton
                                    onClick={() => {
                                        console.log("Reconnect")
                                        socket.connect()
                                    }}
                                >
                                    Reconnect!
                                </ArticlesButton>

                            </div>

                        </div>
                    }

                    <Link
                        href={'/'}
                        className=""
                    >
                        <ArticlesButton
                            className='w-50'
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
                                requestFullscreen('maze-game-page')
                            }
                        }}
                    >
                        {isFullscreen && <span>Exit </span>}
                        {!isFullscreen && <span><i className='fad fa-expand'></i></span>}
                        <span>Fullscreen</span>
                    </ArticlesButton>

                </div>
            </div>

            {/* <div
                className="card card-articles card-sm"
            >
                <div className="card-body d-flex justify-content-between">

                    <div>
                        <div className="small text-muted">playerData</div>
                        <div className="small">
                            <div>X: {playerLocation?.x}</div>
                            <div>Y: {playerLocation?.y}</div>
                            <div>Z: {playerLocation?.z}</div>
                            <div>Shift: {shift ? 'True' : 'False'}</div>
                            <div>Score: 0</div>
                        </div>
                    </div>

                    <div>
                        <div className="small text-muted">maxHeight</div>
                        <div>Y: {maxHeight}</div>
                        <ArticlesButton
                            small
                            onClick={() => {
                                setMaxHeight(playerLocation?.y)
                            }}
                        >
                            Reset
                        </ArticlesButton>
                    </div>

                </div>
            </div> */}

            {/* Touch Controls */}
            <div
                className="card card-articles card-sm"
            >
                <div className="card-body">

                    <div className="small text-muted">Touch Controls</div>

                    <div className='d-flex flex-column'>

                        <div>
                            <ArticlesButton
                                size="sm"
                                className="w-50"
                                active={!touchControlsEnabled}
                                onClick={() => {
                                    setTouchControlsEnabled(false)
                                }}
                            >
                                <i className="fad fa-redo"></i>
                                Off
                            </ArticlesButton>

                            <ArticlesButton
                                size="sm"
                                className="w-50"
                                active={touchControlsEnabled}
                                onClick={() => {
                                    setTouchControlsEnabled(true)
                                }}
                            >
                                <i className="fad fa-redo"></i>
                                On
                            </ArticlesButton>
                        </div>

                    </div>

                </div>
            </div>

            {/* Debug Controls */}
            <div
                className="card card-articles card-sm"
            >
                <div className="card-body">

                    <div className="small text-muted">Debug Controls</div>

                    <div className="small border p-2">
                        <div>Rotation Angle: {hitRotation}</div>
                        <div>Power: {hitPower}/100</div>
                    </div>

                    <div className='d-flex flex-column'>

                        <div>
                            <ArticlesButton
                                size="sm"
                                className="w-50"
                                onClick={reloadScene}
                            >
                                <i className="fad fa-redo"></i>
                                Reload Game
                            </ArticlesButton>

                            <ArticlesButton
                                size="sm"
                                className="w-50"
                                onClick={reloadScene}
                            >
                                <i className="fad fa-redo"></i>
                                Reset Camera
                            </ArticlesButton>
                        </div>

                    </div>

                </div>
            </div>

            {controllerState?.connected &&
                <div className="panel-content-group p-0 text-dark">

                    <div className="p-1 border-bottom border-dark">
                        <div className="fw-bold" style={{ fontSize: '0.7rem' }}>
                            {controllerState?.id}
                        </div>
                    </div>

                    <div className='p-1'>
                        <ArticlesButton
                            small
                            className="w-100"
                            active={showControllerState}
                            onClick={() => {
                                setShowControllerState(prev => !prev)
                            }}
                        >
                            {showControllerState ? 'Hide' : 'Show'} Controller Preview
                        </ArticlesButton>
                    </div>

                    {/* {showControllerState && <div className='p-3'>

                        <ControllerPreview
                            controllerState={controllerState}
                            showJSON={true}
                            showVibrationControls={true}
                            maxHeight={300}
                            showPreview={true}
                        />
                    </div>} */}

                </div>
            }

        </div>
    )

}