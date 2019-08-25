import { Middleware, VNode, Action, Dispatchable, Children } from "hyperapp";

declare const componentHandler: Middleware;

interface RequiredProps {
    key?: string | number;
    state: object;
}

type ComponentContext = { name: string, key: string | number };

interface ComponentParam<Props, PState> {
    name?: string;
    init?: () => PState;
    view: (c: ComponentContext, partialState: PState, props: Props & RequiredProps, children: Children[]) => VNode | null;
}

export function component<Props, PState>(params: ComponentParam<Props, PState>): (props: Props & RequiredProps, children: Children[]) => VNode | null;