"use client"
import { useEffect, useContext, useState, Suspense } from 'react';

import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// import { useSelector, useDispatch } from 'react-redux'

// import ROUTES from 'components/constants/routes'

import ArticlesButton from '@/components/UI/Button';
// import SingleInput from '@/components/UI/SingleInput';
// import { useLocalStorageNew } from '@/hooks/useLocalStorageNew';
// import IsDev from '@/components/IsDev';
// import { ChromePicker } from 'react-color';
// import { useSocketStore } from '@/hooks/useSocketStore';

// import GameScoreboard from 'components/Games/GameScoreboard'

// const Ad = dynamic(() => import('components/Ads/Ad'), {
//     ssr: false,
// });

// const InfoModal = dynamic(
//     () => import('@/components/UI/InfoModal'),
//     { ssr: false }
// )

// const SettingsModal = dynamic(
//     () => import('@/components/UI/SettingsModal'),
//     { ssr: false }
// )

// const PrivateGameModal = dynamic(
//     () => import('app/(site)/community/games/four-frogs/components/PrivateGameModal'),
//     { ssr: false }
// )

const assets_src = 'games/Cannon/'

const game_key = 'memory-game'
const game_name = 'Memory Game'
const game_port = "3027"

import GameScoreboard from '@articles-media/articles-dev-box/GameScoreboard';
import Ad from '@articles-media/articles-dev-box/Ad';

import useUserDetails from '@articles-media/articles-dev-box/useUserDetails';
import useUserToken from '@articles-media/articles-dev-box/useUserToken';

import { GamepadKeyboard, PieMenu } from '@articles-media/articles-gamepad-helper';
import { useStore } from '@/hooks/useStore';
import { useSocketStore } from '@/hooks/useSocketStore';
import { OverlayTrigger, Popover } from 'react-bootstrap';
// import { set } from 'lodash';

const SessionButton = dynamic(() =>
    import('@articles-media/articles-dev-box/SessionButton'),
    { ssr: false }
);

const ReturnToLauncherButton = dynamic(() =>
    import('@articles-media/articles-dev-box/ReturnToLauncherButton'),
    { ssr: false }
);

export default function LobbyPage() {

    const socket = useSocketStore(state => state.socket)
    const connected = useSocketStore(state => state.connected)

    const _hasHydrated = useStore((state) => state._hasHydrated)

    const darkMode = useStore((state) => state.darkMode)
    const toggleDarkMode = useStore((state) => state.toggleDarkMode)

    const nickname = useStore((state) => state.nickname)
    const setNickname = useStore((state) => state.setNickname)
    const randomNickname = useStore((state) => state.randomNickname)
    const nicknameKeyboard = useStore((state) => state.nicknameKeyboard)

    const setShowInfoModal = useStore((state) => state.setShowInfoModal)
    const setShowSettingsModal = useStore((state) => state.setShowSettingsModal)
    const setShowCreditsModal = useStore((state) => state.setShowCreditsModal)

    const lobbyDetails = useStore((state) => state.lobbyDetails)

    useEffect(() => {

        if (connected) {
            socket?.emit('join-room', `game:${game_key}-landing`);
        }

        return function cleanup() {
            socket?.emit('leave-room', `game:${game_key}-landing`)
        };

    }, [connected]);

    // const {
    //     socket,
    // } = useSocketStore(state => ({
    //     socket: state.socket,
    // }));

    // const userReduxState = useSelector((state) => state.auth.user_details)
    // const userReduxState = false

    // const [nickname, setNickname] = useLocalStorageNew("game:nickname", userReduxState.display_name)

    // const [showInfoModal, setShowInfoModal] = useState(false)
    // const [showSettingsModal, setShowSettingsModal] = useState(false)
    // const [showPrivateGameModal, setShowPrivateGameModal] = useState(false)

    // const [lobbyDetails, setLobbyDetails] = useState({
    //     players: [],
    //     games: [],
    // })

    // useEffect(() => {

    //     setShowInfoModal(localStorage.getItem('game:four-frogs:rulesAnControls') === 'true' ? true : false)

    //     // if (userReduxState._id) {
    //     //     console.log("Is user")
    //     // }

    //     socket.on('game:death-race-landing-details', function (msg) {
    //         console.log('game:death-race-landing-details', msg)

    //         if (JSON.stringify(msg) !== JSON.stringify(lobbyDetails)) {
    //             setLobbyDetails(msg)
    //         }
    //     });

    //     return () => {
    //         socket.off('game:death-race-landing-details');
    //     };

    // }, [])

    // useEffect(() => {

    //     if (socket.connected) {
    //         socket.emit('join-room', 'game:death-race-landing');
    //     }

    //     return function cleanup() {
    //         socket.emit('leave-room', 'game:death-race-landing')
    //     };

    // }, [socket.connected]);

    const {
        data: userToken,
        error: userTokenError,
        isLoading: userTokenLoading,
        mutate: userTokenMutate
    } = useUserToken(
        game_port
    );

    const {
        data: userDetails,
        error: userDetailsError,
        isLoading: userDetailsLoading,
        mutate: userDetailsMutate
    } = useUserDetails({
        token: userToken
    });

    return (

        <div className="memory-game-landing-page">

            <Suspense>
                <GamepadKeyboard
                    disableToggle={true}
                    active={nicknameKeyboard}
                    onFinish={(text) => {
                        console.log("FINISH KEYBOARD", text)
                        useStore.getState().setNickname(text);
                        useStore.getState().setNicknameKeyboard(false);
                    }}
                    onCancel={(text) => {
                        console.log("CANCEL KEYBOARD", text)
                        // useStore.getState().setNickname(text);
                        useStore.getState().setNicknameKeyboard(false);
                    }}
                />
                <PieMenu
                    options={[
                        {
                            label: 'Settings',
                            icon: 'fad fa-cog',
                            callback: () => {
                                setShowSettingsModal(prev => !prev)
                            }
                        },
                        {
                            label: 'Go Back',
                            icon: 'fad fa-arrow-left',
                            callback: () => {
                                window.history.back()
                            }
                        },
                        {
                            label: 'Credits',
                            icon: 'fad fa-info-circle',
                            callback: () => {
                                setShowCreditsModal(true)
                            }
                        },
                        {
                            label: 'Game Launcher',
                            icon: 'fad fa-gamepad',
                            callback: () => {
                                window.location.href = 'https://games.articles.media';
                            }
                        },
                        {
                            label: `${darkMode ? "Light" : "Dark"} Mode`,
                            icon: 'fad fa-palette',
                            callback: () => {
                                toggleDarkMode()
                            }
                        }
                    ]}
                    onFinish={(event) => {
                        console.log("Event", event)
                        if (event.callback) {
                            event.callback()
                        }
                    }}
                />
            </Suspense>

            <div className='background-wrap'>
                {darkMode ?
                    <img
                        src={`img/dark-preview.webp`}
                        alt=""
                    // fill
                    // style={{ objectFit: 'cover', objectPosition: 'center', filter: 'blur(10px)' }}
                    />
                    :
                    <img
                        src={`img/preview.webp`}
                        alt=""
                    // fill
                    // style={{ objectFit: 'cover', objectPosition: 'center', filter: 'blur(10px)' }}
                    />
                }

            </div>

            <div className="container d-flex flex-column-reverse flex-lg-row justify-content-center align-items-center">

                <div
                    style={{ "width": "20rem" }}
                >

                    <div
                        className='hero mb-3 d-flex flex-column justify-content-center align-items-center'
                        style={{ position: 'relative' }}
                    >
                        <Image
                            src={"/img/icon.png"}
                            alt="Logo"
                            // fill
                            width={200}
                            height={200}
                            style={{
                                objectFit: 'contain',
                                // height: '200px',
                                // width: '200px',
                            }}
                        />
                        <div className="hero-title">
                            <span className='green'>Mem</span>
                            <span className='blue'>ory</span>
                            <span> </span>
                            <span className='yellow'>Ga</span>
                            <span className='red'>me</span>
                        </div>
                    </div>

                    <div
                        className="card card-articles card-sm mb-3"
                    >

                        <div className='card-header d-flex align-items-center'>

                            <div className="flex-grow-1">

                                <div className="form-group articles mb-0">
                                    <label htmlFor="nickname">Nickname</label>
                                    {/* <SingleInput
                                        value={nickname}
                                        setValue={setNickname}
                                        noMargin
                                    /> */}
                                    {/* <input
                                        type="text"
                                        value={nickname}
                                        onChange={(e) => setNickname(e.target.value)}
                                        className="form-control"
                                        id="nickname"
                                        placeholder="Enter your nickname"
                                    /> */}
                                    <div className="d-flex align-items-center">
                                        <input
                                            type="text"
                                            value={_hasHydrated ? nickname : ''}
                                            disabled={!_hasHydrated}
                                            id="nickname"
                                            name="nickname"
                                            placeholder="Enter your nickname"
                                            onChange={(e) => {
                                                setNickname(e.target.value)
                                            }}
                                            className={`form-control form-control-sm`}
                                        />
                                        <ArticlesButton
                                            small
                                            className=""
                                            onClick={() => {
                                                randomNickname()
                                            }}
                                        >
                                            <i className="fad fa-random"></i>
                                        </ArticlesButton>
                                    </div>
                                </div>

                                <div className='mt-1' style={{ fontSize: '0.8rem' }}>Visible to all players</div>

                            </div>
                        </div>

                        <div className="card-body">

                            <Link href={{
                                pathname: `/play`
                            }}>
                                <ArticlesButton
                                    className={`w-100 mb-3`}
                                    small
                                >
                                    <i className="fas fa-play"></i>
                                    Play Single Player
                                </ArticlesButton>
                            </Link>

                            <div className="fw-bold mb-1 small text-center">
                                {lobbyDetails.players.length || 0} player{lobbyDetails.players.length > 1 && 's'} in the lobby.
                            </div>

                            <div className="servers">

                                {[1, 2, 3, 4].map(id => {

                                    let lobbyLookup = lobbyDetails?.fourFrogsGlobalState?.games?.find(lobby =>
                                        parseInt(lobby.server_id) == id
                                    )

                                    return (
                                        <div key={id} className="server">

                                            <div className='d-flex justify-content-between align-items-center w-100 mb-2'>
                                                <div className="mb-0" style={{ fontSize: '0.9rem' }}><b>Server {id}</b></div>
                                                <div className='mb-0'>{lobbyLookup?.players?.length || 0}/4</div>
                                            </div>

                                            <div className='d-flex justify-content-around w-100 mb-1'>
                                                {[1, 2, 3, 4].map(player_count => {

                                                    let playerLookup = false

                                                    if (lobbyLookup?.players?.length >= player_count) playerLookup = true

                                                    return (
                                                        <div key={player_count} className="icon" style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            ...(playerLookup ? {
                                                                backgroundColor: 'black',
                                                            } : {
                                                                backgroundColor: 'gray',
                                                            }),
                                                            border: '1px solid black'
                                                        }}>

                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <Link
                                                className={``}
                                                href={{
                                                    pathname: `/play`,
                                                    query: {
                                                        server: id
                                                    }
                                                }}
                                            >
                                                <ArticlesButton
                                                    className="px-5"
                                                    small
                                                    disabled={!connected}
                                                >
                                                    Join
                                                </ArticlesButton>
                                            </Link>

                                        </div>
                                    )
                                })}

                            </div>

                        </div>

                        <div className="card-footer d-flex flex-wrap justify-content-center">

                            {/* <ArticlesButton
                                className={`w-50`}
                                small
                                onClick={() => {
                                    setShowSettingsModal(prev => !prev)
                                }}
                            >
                                <i className="fad fa-cog"></i>
                                Settings
                            </ArticlesButton> */}
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
                                    <i className="fad fa-sun"></i>
                                </ArticlesButton>
                            </div>

                            <ArticlesButton
                                className={`w-50`}
                                small
                                onClick={() => {
                                    setShowInfoModal(true)
                                }}
                            >
                                <i className="fad fa-info-square"></i>
                                Info
                            </ArticlesButton>

                            <a
                                href={'https://github.com/Articles-Joey/memory-game'}
                                className='w-50'
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ArticlesButton
                                    className={`w-100`}
                                    small
                                    onClick={() => {

                                    }}
                                >
                                    <i className="fab fa-github"></i>
                                    Github
                                </ArticlesButton>
                            </a>

                            <ArticlesButton
                                className={`w-50`}
                                small
                                onClick={() => {
                                    setShowCreditsModal(true)
                                }}
                            >
                                <i className="fad fa-users"></i>
                                Credits
                            </ArticlesButton>

                        </div>

                    </div>

                    <SessionButton
                        port={game_port}
                    />

                    <ReturnToLauncherButton />

                </div>

                <GameScoreboard
                    game={game_name}
                    style="Default"
                    darkMode={darkMode ? true : false}
                />

                <Ad
                    style="Default"
                    section={"Games"}
                    section_id={game_name}
                    darkMode={darkMode ? true : false}
                    user_ad_token={userToken}
                    userDetails={userDetails}
                    userDetailsLoading={userDetailsLoading}
                />

            </div>
        </div>
    );
}