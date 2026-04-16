import { readFileSync } from "fs";
import YAML from "yaml";

/**
 * Contract model — parsed from contract.yaml
 * Defines the shared agreement between Dev and SDET about app structure and behavior
 */

export interface Contract {
  framework: string;
  dev_server: DevServerConfig;
  semantic_requirements: SemanticRequirement[];
  elements: ContractElement[];
  routes: Route[];
  user_flows: UserFlow[];
  accessibility?: AccessibilityRule[];
}

export interface DevServerConfig {
  command: string;
  port: number;
  ready_signal: string;
  startup_timeout_ms: number;
}

export interface SemanticRequirement {
  element: string;
  required: boolean;
  description: string;
}

export interface ContractElement {
  testid: string;
  element: string;
  type?: string;
  location?: string;
  description: string;
  assert?: string | string[];
  placeholder?: string;
  children?: ElementChildren;
  [key: string]: unknown; // Allow additional fields for extensibility
}

export interface ElementChildren {
  testid_pattern: string;
  element: string;
  contains?: ContractElement[];
  [key: string]: unknown;
}

export interface Route {
  path: string;
  description: string;
  elements: string[];
}

export interface UserFlow {
  name: string;
  description: string;
  preconditions: string;
  setup?: FlowStep[];
  steps: FlowStep[];
  assertions: FlowAssertion[];
}

export interface FlowStep {
  action: "type" | "click" | "clear" | "select" | "hover" | "wait" | "navigate";
  target: string;
  value?: string;
}

export interface FlowAssertion {
  assert:
    | "visible"
    | "hidden"
    | "text_contains"
    | "count"
    | "has_class"
    | "not_has_class"
    | "value_equals"
    | "enabled"
    | "disabled";
  target: string;
  value?: string | number;
  class?: string;
  description?: string;
}

export interface AccessibilityRule {
  rule: string;
  description: string;
}

/**
 * Load a contract.yaml file and parse it into a Contract object
 * @param filePath - Absolute path to contract.yaml
 * @returns Parsed Contract object
 * @throws Error if file cannot be read or YAML is invalid
 */
export function loadContract(filePath: string): Contract {
  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed = YAML.parse(content) as Contract;

    // Validate required fields
    if (!parsed.framework) {
      throw new Error("Contract missing required field: framework");
    }
    if (!parsed.dev_server) {
      throw new Error("Contract missing required field: dev_server");
    }
    if (!Array.isArray(parsed.semantic_requirements)) {
      throw new Error(
        "Contract.semantic_requirements must be an array"
      );
    }
    if (!Array.isArray(parsed.elements)) {
      throw new Error("Contract.elements must be an array");
    }
    if (!Array.isArray(parsed.user_flows)) {
      throw new Error("Contract.user_flows must be an array");
    }

    return parsed;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load contract from ${filePath}: ${error.message}`
      );
    }
    throw error;
  }
}

/**
 * Serialize a Contract back to YAML string
 * (Useful for rendering contracts into prompts)
 * @param contract - Contract object to serialize
 * @returns YAML string representation
 */
export function contractToYAML(contract: Contract): string {
  return YAML.stringify(contract, { indent: 2 });
}
