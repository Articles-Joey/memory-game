import WoodenPicketFence from "./WoodenPicketFence";

export default function FenceCircle({ radius = 25, segments, ...props }) {
    return (
        <WoodenPicketFence
            {...props}
            shape="circle"
            radius={radius}
            segments={segments}
        />
    );
}
