"use client"
import { useEffect, useContext, useState, Suspense } from 'react';

import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'

import { useStore } from '@/hooks/useStore';
import { useSocketStore } from '@/hooks/useSocketStore';

import ArticlesButton from '@/components/UI/Button';

import useUserDetails from '@articles-media/articles-dev-box/useUserDetails';
import useUserToken from '@articles-media/articles-dev-box/useUserToken';
import NicknameInput from '@articles-media/articles-dev-box/NicknameInput';
import GameMenuPrimaryButtonGroup from '@articles-media/articles-dev-box/GameMenuPrimaryButtonGroup';
import SessionButton from '@articles-media/articles-dev-box/SessionButton';
import { GamepadKeyboard, PieMenu } from '@articles-media/articles-gamepad-helper';
import PageTemplateLandingPage from '@articles-media/articles-dev-box/PageTemplateLandingPage';
import LandingBackgroundAnimation from '@/components/Game/LandingBackgroundAnimation';

const ReturnToLauncherButton = dynamic(() =>
    import('@articles-media/articles-dev-box/ReturnToLauncherButton'),
    { ssr: false }
);
const GameScoreboard = dynamic(() =>
    import('@articles-media/articles-dev-box/GameScoreboard'),
    { ssr: false }
);
const Ad = dynamic(() =>
    import('@articles-media/articles-dev-box/Ad'),
    { ssr: false }
);

const game_key = process.env.NEXT_PUBLIC_GAME_KEY
const game_name = process.env.NEXT_PUBLIC_GAME_NAME
const game_port = process.env.NEXT_PUBLIC_GAME_PORT

export default function LobbyPage() {

    const socket = useSocketStore(state => state.socket)
    const connected = useSocketStore(state => state.connected)

    const darkMode = useStore((state) => state.darkMode)
    const toggleDarkMode = useStore((state) => state.toggleDarkMode)
    const toontownMode = useStore((state) => state.toontownMode)

    const nicknameKeyboard = useStore((state) => state.nicknameKeyboard)

    const setShowInfoModal = useStore((state) => state.setShowInfoModal)
    const setShowSettingsModal = useStore((state) => state.setShowSettingsModal)
    const setShowCreditsModal = useStore((state) => state.setShowCreditsModal)

    const lobbyDetails = useStore((state) => state.lobbyDetails)

    const [joinGame, setJoinGame] = useState(false)

    // useEffect(() => {

    //     if (connected) {
    //         socket?.emit('join-room', `game:${game_key}-landing`);
    //     }

    //     return function cleanup() {
    //         socket?.emit('leave-room', `game:${game_key}-landing`)
    //     };

    // }, [connected, socket]);

    const {
        data: userToken,
        error: userTokenError,
        isLoading: userTokenLoading,
        mutate: userTokenMutate
    } = useUserToken(
        process.env.NEXT_PUBLIC_GAME_PORT
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

        <div className={`landing-page`}>

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

            <PageTemplateLandingPage
                useSocketStore={useSocketStore}
                useStore={useStore}
                // RotatingMascot={RotatingMascot}
                Link={Link}
                logoImage={`img/icon.png`}
                LandingBackgroundAnimation={
                    <LandingBackgroundAnimation />
                }
                heroOverride={<>
                    {/* <img
                        src={
                            toontownMode ?
                                "img/toontown-hero.webp"
                                :
                        }
                        alt="Hero Image"
                        className='w-100'
                    /> */}
                    <div
                        className='hero mb-3 d-flex flex-column justify-content-center align-items-center'
                        style={{ position: 'relative' }}
                    >
                        <Image
                            src={"/img/icon.png"}
                            alt="Logo"
                            // fill
                            loading="eager"
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
                </>}
                NicknameInputConfig={{
                    PreComponent:
                        <>
                            {/* <img
                                className='panel-bg me-2'
                                src="img/toontown_icon.webp"
                                width={70}
                                height={70}
                            /> */}
                        </>
                }}
                backgroundImage={
                    toontownMode ?
                        darkMode ?
                            `img/toontown-preview.webp`
                            :
                            `img/toontown-preview.webp`
                        :
                        darkMode ?
                            `img/preview-dark.webp`
                            :
                            `img/preview.webp`
                }
                singlePlayerConfig={{
                    attachServerType: "single-player",
                }}
                multiplayerConfig={{
                    type: "WebSocket",
                    comingSoon: true,
                    defaultServers: 2,
                    privateServerSupport: false,
                    onlinePlayersTemplate: "2.0",
                }}
                brandingTextClass="jaro-primary"
            />

        </div>
    );
}