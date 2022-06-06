const { currentPage } = figma;

const nodeTypes = [
  "SLICE",
  "FRAME",
  "GROUP",
  "COMPONENT_SET",
  "COMPONENT",
  "INSTANCE",
  "BOOLEAN_OPERATION",
  "VECTOR",
  "STAR",
  "LINE",
  "ELLIPSE",
  "POLYGON",
  "RECTANGLE",
  "TEXT",
  "STICKY",
  "CONNECTOR",
  "SHAPE_WITH_TEXT",
  "CODE_BLOCK",
  "STAMP",
  "WIDGET",
  "EMBED",
  "LINK_UNFURL",
  "MEDIA",
  "SECTION",
  "HIGHLIGHT",
  "WASHI_TAPE",
] as const;

export function parse_and_select(selector: string): void {
  const parsed_node_types = parseNodeName(selector);
  const nodes = figma.currentPage.findAllWithCriteria({
    types: parsed_node_types,
  });
  currentPage.selection = nodes;
}

type SceneNodeType = SceneNode["type"];

function parseNodeName(input: string): SceneNodeType[] {
  const nodeName = nodeTypes.find((validName) => validName === input);
  if (nodeName) {
    return [nodeName];
  } else {
    return [];
  }
}
