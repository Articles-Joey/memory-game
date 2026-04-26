"use client"

import DarkModeHandler from '@/components/UI/DarkModeHandler';
import { useStore } from '@/hooks/useStore';
import GlobalBody from '@articles-media/articles-dev-box/GlobalBody';
import ToontownModeHandler from '@articles-media/articles-dev-box/ToontownModeHandler';

export default function LayoutClient({ children }) {

    return (
        <>
            <ToontownModeHandler 
                useStore={useStore}
            />
            <GlobalBody />
            <DarkModeHandler
                useStore={useStore}
            />
        </>
    );
}
