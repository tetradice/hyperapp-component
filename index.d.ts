import { Middleware, VNode, Action, Dispatchable } from "hyperapp";

declare const modularize: Middleware;

interface RequiredProps {
    id: ModuleId;
    state: object;
}

type ModuleId = string | number;

type ModuleContext = { '__modularizeContext__': true, name: string, id: ModuleId };

interface ModuleParam<Props, PState> {
    init: () => PState;
    view: (m: ModuleContext, props: Props & RequiredProps, state: PState) => VNode<any>;
}

export function createModule<Props, PState>(name: string, params: ModuleParam<Props, PState>): (props: Props & RequiredProps, children: VNode<any>) => VNode<any>;


