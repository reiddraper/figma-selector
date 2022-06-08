import { parse_and_select } from "figma-selector";

const { widget } = figma;
const { Frame, Input, Text, useSyncedState } = widget;

function Selector() {
  const [text, setText] = useSyncedState("text", "");
  const [count, setCount] = useSyncedState("count", 0);
  return (
    <Frame
      name="Selector"
      fill={{
        type: "gradient-linear",
        gradientHandlePositions: [
          { x: 0, y: 0.5 },
          { x: 1, y: 0.5 },
          { x: 0, y: 0 },
        ],
        gradientStops: [
          {
            position: 0,
            color: {
              r: 0.6313725709915161,
              g: 0.5490196347236633,
              b: 0.8196078538894653,
              a: 1,
            },
          },
          {
            position: 1,
            color: {
              r: 0.9843137264251709,
              g: 0.7607843279838562,
              b: 0.9215686321258545,
              a: 1,
            },
          },
        ],
      }}
      cornerRadius={16}
      width={800}
      height={200}
    >
      <Input
        name="selector-input"
        fill="#000"
        fontFamily="Roboto Mono"
        fontSize={24}
        width={600}
        horizontalAlignText="center"
        x={{
          type: "center",
          offset: 0.5,
        }}
        y={{
          type: "center",
          offset: 0.5,
        }}
        onTextEditEnd={(event) => {
          const text = event.characters;
          setText(text);
          const numNodes = parse_and_select(text);
          setCount(numNodes);
        }}
        placeholder="css selector"
        value={text}
        inputFrameProps={{
          fill: "#fff",
          cornerRadius: 16,
          padding: 8,
        }}
      ></Input>
      <Frame
        name="Count"
        x={716}
        y={18}
        fill="#FFF"
        cornerRadius={100}
        width={60}
        height={60}
      >
        <Text
          name="Select count"
          x={{
            type: "center",
            offset: -0.5,
          }}
          y={{
            type: "center",
            offset: 0,
          }}
          fill="#888"
          horizontalAlignText="center"
          fontFamily="Roboto Mono"
          fontSize={24}
        >
          {count}
        </Text>
      </Frame>
    </Frame>
  );
}

widget.register(Selector);
