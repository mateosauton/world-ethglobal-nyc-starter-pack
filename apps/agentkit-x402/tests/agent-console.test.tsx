import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

const hookStore = vi.hoisted(() => ({
  hookIndex: 0,
  refs: [] as { current: unknown }[],
  state: [] as { value: unknown }[],
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    useRef<T>(initial: T) {
      const index = hookStore.hookIndex++;
      const ref = hookStore.refs[index] ?? { current: initial };
      hookStore.refs[index] = ref;
      return ref as { current: T };
    },
    useState<T>(initial: T) {
      const index = hookStore.hookIndex++;
      const state = hookStore.state[index] ?? { value: initial };
      hookStore.state[index] = state;
      return [
        state.value as T,
        (next: T | ((previous: T) => T)) => {
          state.value = typeof next === "function"
            ? (next as (previous: T) => T)(state.value as T)
            : next;
        },
      ] as const;
    },
  };
});

import { AgentConsole } from "../components/agent-console";
import { NON_HUMAN_BACKED_AGENT_ADDRESS } from "../lib/demo-call";

type ElementNode = {
  props: Record<string, unknown>;
};

function findElement(node: unknown, predicate: (element: ElementNode) => boolean): ElementNode | undefined {
  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, predicate);
      if (match) return match;
    }
    return undefined;
  }
  if (!isValidElement(node)) return undefined;

  const element = node as unknown as ElementNode;
  if (predicate(element)) return element;
  return findElement(element.props.children, predicate);
}

function textContent(node: unknown): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (!isValidElement(node)) return "";
  return textContent((node as unknown as ElementNode).props.children);
}

function renderConsole() {
  hookStore.hookIndex = 0;
  return AgentConsole({ mode: "simulator" });
}

describe("AgentConsole", () => {
  it("ignores an in-flight response after the simulator agent changes", async () => {
    hookStore.hookIndex = 0;
    hookStore.refs = [];
    hookStore.state = [];

    let resolveFetch: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () => new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
      ),
    );

    const requestButton = findElement(
      renderConsole(),
      (element) => element.props.children === "Run AgentKit access",
    );
    const agentSelector = findElement(
      renderConsole(),
      (element) => element.props.value === "0xbEBB5B46fFDA7E7494595E826FC4D4a61ce5f6A6",
    );

    (requestButton?.props.onClick as () => void)();
    await Promise.resolve();
    (agentSelector?.props.onValueChange as (value: string) => void)(NON_HUMAN_BACKED_AGENT_ADDRESS);

    resolveFetch!({
      ok: true,
      json: async () => ({
        mode: "simulator",
        outcome: "human-trial",
        events: [],
        resource: { signal: "stale-response", confidence: 0.92 },
      }),
    } as Response);
    await Promise.resolve();
    await Promise.resolve();

    const html = textContent(renderConsole());
    expect(html).toContain("call 0/4");
    expect(html).toContain("No protected payload released.");
    expect(html).not.toContain("stale-response");
  });
});
