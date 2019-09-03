import { Middleware, VNode, Action, Dispatchable, Children, Effect } from "hyperapp";

declare const componentHandler: Middleware;

interface RequiredProps<MainState> {
    key?: string | number;
    state: MainState;
}

interface ComponentContext {
    <S, P>(action: Action<S, P>): Action<S, P>;
}

interface ComponentParam<Props, PState, MainState> {
    name?: string;
    init?: () => PState;
    view: (c: ComponentContext, partialState: PState, props: Props & RequiredProps<MainState>, children: Children[]) => VNode | null;
}

interface Component<Props, MainState> {
    (props: Props & RequiredProps<MainState>, children: Children[]): VNode | null;
    componentName: string;
    destroyState: (key?: string | number) => Effect<MainState>;
    destroyAllStatus: () => Effect<MainState>;
}

export function component<Props, PState, MainState>(params: ComponentParam<Props, PState, MainState>): Component<Props, MainState>;