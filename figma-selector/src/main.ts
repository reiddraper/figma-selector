import {
  CssSelectorParser,
  Rule,
  RuleAttr,
  RulePseudo,
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

enum Search {
  ALL = "ALL", // includes self
  CHILDREN = "CHILDREN",
  DESCENDANTS = "DESCENDANTS",
}

export function parse_and_select(selector: string): number {
  console.log(JSON.stringify(parse_selector(selector)));
  const rootNode = figma.currentPage;
  const nodes = find_selection(rootNode, parse_selector(selector), Search.ALL);
  currentPage.selection = nodes;
  return nodes.length;
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
  parser.registerNumericPseudos("nth-child");
  return parser.parse(selector);
}

function find_selection(
  node: BaseNode,
  selector: Selector,
  search: Search
): SceneNode[] {
  if (selector.type === "selectors") {
    return selector.selectors.reduce((acc, ruleset) => {
      const nodes = find_ruleset(node, ruleset, search);
      return acc.concat(nodes);
    }, [] as SceneNode[]);
  } else {
    return find_ruleset(node, selector, search);
  }
}

function find_ruleset(
  node: BaseNode,
  ruleset: RuleSet,
  search: Search
): SceneNode[] {
  return find_rule(node, ruleset.rule, search);
}

function find_rule(node: BaseNode, rule: Rule, search: Search): SceneNode[] {
  /*
  console.log(
    `find_rule: node: ${node.type} rule: ${JSON.stringify(
      rule
    )} search: ${search}`
  );
  */
  let candidates: SceneNode[] = [];
  if (rule.tagName) {
    let all_typed_nodes: SceneNode[] = [];
    const upperCaseTagName = rule.tagName.toUpperCase();

    // If our search is for Search.ALL,
    // consider the current node, and not
    // just its children or descendants
    if (
      search === Search.ALL &&
      node.type === upperCaseTagName &&
      parseNodeName(upperCaseTagName).length > 0
    ) {
      // NOTE: This cast is safe because we checked
      // that the node type is a SceneNode
      // above
      all_typed_nodes.push(node as SceneNode);
    }

    if (
      (search === Search.DESCENDANTS || search === Search.ALL) &&
      "findAllWithCriteria" in node
    ) {
      const typesafe_tag_name = parseNodeName(upperCaseTagName);
      const children_matching_tag = node.findAllWithCriteria({
        types: typesafe_tag_name,
      });
      all_typed_nodes = all_typed_nodes.concat(children_matching_tag);
    } else if (search === Search.CHILDREN && "children" in node) {
      for (const child of node.children) {
        if (child.type === upperCaseTagName) {
          all_typed_nodes.push(child as SceneNode);
        }
      }
    }
    const attr_filtered_nodes = all_typed_nodes.filter((node) =>
      matches_rule(node, rule, search)
    );
    candidates = candidates.concat(attr_filtered_nodes);
  }
  if ("rule" in rule && rule.rule !== undefined) {
    const subRule = rule.rule;
    let oldCandidates = candidates;
    candidates = [];
    let searchType: Search = Search.DESCENDANTS; // default case
    if (subRule.nestingOperator === null) {
      searchType = Search.DESCENDANTS;
    }
    if (subRule.nestingOperator === ">") {
      searchType = Search.CHILDREN;
    }
    for (const subNode of oldCandidates) {
      const subCandidates = find_rule(subNode, subRule, searchType);
      candidates = candidates.concat(subCandidates);
    }
  }
  return candidates;
}

function matches_rule(node: SceneNode, rule: Rule, search: Search): boolean {
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

  if ("pseudos" in rule) {
    for (const pseudo of rule.pseudos) {
      if (!matches_pseudo(node, pseudo, Search.ALL)) {
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
      return attr.value === node.authorName;
    } else {
      // Other node types don't have an author, so we don't match
      return false;
    }
  }
  // TODO: return false if unimplemented attributes are used
  return true;
}

function matches_pseudo(
  node: SceneNode,
  pseudo: RulePseudo,
  search: Search
): boolean {
  if (
    pseudo.name === "stuck" &&
    "valueType" in pseudo &&
    pseudo.valueType === "selector" &&
    "stuckNodes" in node
  ) {
    let matching_nodes: SceneNode[] = [];
    for (const stuckNode of node.stuckNodes) {
      const result = find_selection(stuckNode, pseudo.value, search);
      matching_nodes = matching_nodes.concat(result);
    }
    return matching_nodes.length > 0;
  }
  return false;
}
