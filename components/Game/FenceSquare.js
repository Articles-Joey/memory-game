import WoodenPicketFence from "./WoodenPicketFence";

export default function FenceSquare({ size = 60, ...props }) {
    return (
        <WoodenPicketFence
            size={size}
            {...props}
        />
    );
}
