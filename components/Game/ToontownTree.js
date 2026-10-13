import ToontownBillboard from "./ToontownBillboard";

export default function ToontownTree({
    height = 26,
    textureUrl = "/img/toontown/tree_big.png",
    ...props
}) {
    return (
        <ToontownBillboard
            {...props}
            name="toon-tree"
            height={height}
            textureUrl={textureUrl}
        />
    );
}
