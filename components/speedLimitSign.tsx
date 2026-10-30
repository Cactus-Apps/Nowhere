import { Svg, Circle, Text as SvgText } from "react-native-svg";

/**
 * European speed limit round sign (Vienna Convention),
 * based on assets/images/Ellipse 3.svg: red ring #FE0A0C, white face,
 * black number. The value comes in as a text prop so any value (including
 * speed limits from OSM) can be rendered without extra assets.
 */
export function SpeedLimitSign({
  value,
  size = 40,
}: {
  value: number;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={100} fill="#FFFFFF" />
      <Circle cx={100} cy={100} r={90} stroke="#FE0A0C" strokeWidth={20} fill="none" />
      <SvgText
        x={100}
        y={128}
        fontSize={78}
        fontWeight="800"
        fill="#0B0C0E"
        textAnchor="middle"
      >
        {String(value)}
      </SvgText>
    </Svg>
  );
}
