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

import GameMenuPrimaryButtonGroup from '@articles-media/articles-dev-box/GameMenuPrimaryButtonGroup';
import { useRouter } from "next/navigation";

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

                    <GameMenuPrimaryButtonGroup
                        useStore={useStore}
                        type="GameMenu"
                        useRouter={useRouter}
                    />

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