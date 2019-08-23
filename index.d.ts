import { Middleware, VNode, Action, Dispatchable } from "hyperapp";

declare const componentHandler: Middleware;

interface RequiredProps {
    id?: ComponentId;
    state: object;
}

type ComponentId = string | number;

type ComponentContext = { name: string, id: ComponentId };

interface ComponentParam<Props, PState> {
    name?: string;
    init?: () => PState;
    view: (c: ComponentContext, partialState: PState, props: Props & RequiredProps, children: VNode<any>) => VNode<any>;
}

export function component<Props, PState>(params: ComponentParam<Props, PState>): (props: Props & RequiredProps, children: VNode<any>) => VNode<any>;


