import {
  CssSelectorParser,
  Rule,
  RuleAttr,
  RuleSet,
  Selector,
} from "css-selector-parser";

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
  console.log(JSON.stringify(parse_selector(selector)));
  const nodes = find_selection(parse_selector(selector));
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

function parse_selector(selector: string): Selector {
  const parser = new CssSelectorParser();
  parser.registerNestingOperators(">");
  parser.registerSelectorPseudos("stuck");
  return parser.parse(selector);
}

function find_selection(selector: Selector): SceneNode[] {
  if (selector.type === "selectors") {
    return selector.selectors.reduce((acc, ruleset) => {
      const nodes = find_ruleset(ruleset);
      return acc.concat(nodes);
    }, [] as SceneNode[]);
  } else {
    return find_ruleset(selector);
  }
}

function find_ruleset(ruleset: RuleSet): SceneNode[] {
  return find_rule(ruleset.rule);
}

function find_rule(rule: Rule): SceneNode[] {
  if (rule.tagName) {
    const typesafe_tag_name = parseNodeName(rule.tagName.toUpperCase());
    const all_typed_nodes = figma.currentPage.findAllWithCriteria({
      types: typesafe_tag_name,
    });
    const attr_filtered_nodes = all_typed_nodes.filter((node) =>
      matches_rule(node, rule)
    );
    return attr_filtered_nodes;
  } else {
    // TODO: handle no tag name
    return [];
  }
}

function matches_rule(node: SceneNode, rule: Rule): boolean {
  // NOTE:
  // We have to do this because the Rule type
  // mistakenly has the attrs property as non-nullable,
  // when in reality it is nullable
  if ("attrs" in rule) {
    for (const attr of rule.attrs) {
      if (!matches_attr(node, attr)) {
        return false;
      }
    }
  }
  return true;
}

function matches_attr(node: SceneNode, attr: RuleAttr): boolean {
  if (attr.name === "name" && "value" in attr) {
    return attr.value === node.name;
  }
  if (attr.name === "author" && "value" in attr) {
    if (node.type === "STICKY") {
      console.log(`author: ${attr.value} node.authorName: ${node.authorName}`);
      return attr.value === node.authorName;
    } else {
      // Other node types don't have an author, so we don't match
      return false;
    }
  }
  return true;
}
