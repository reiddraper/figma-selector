import { parse_and_select } from "figma-selector";

const { widget } = figma;
const { AutoLayout, Input, useSyncedState } = widget;

function Selector() {
  const [text, setText] = useSyncedState("text", "");
  return (
    <AutoLayout
      name="Selector"
      fill="#FFF"
      cornerRadius={16}
      spacing={10}
      padding={{
        vertical: 92,
        horizontal: 132,
      }}
    >
      <Input
        name="selector-input"
        fill="#000"
        fontFamily="Inter"
        fontSize={24}
        onTextEditEnd={() => {}}
        value={text}
        inputFrameProps={{
          fill: "#ddd",
          cornerRadius: 16,
          padding: 20,
        }}
      ></Input>
    </AutoLayout>
  );
}

widget.register(Selector);
