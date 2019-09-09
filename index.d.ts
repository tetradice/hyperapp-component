import { Middleware, VNode, Action, Dispatchable, Children, Effect } from "hyperapp";

declare const componentHandler: Middleware;

type IdValue = string | number | undefined;

interface RequiredProps<MainState> {
    id: IdValue;
    state: MainState;
}

interface ComponentContext {
    <S, P>(action: Action<S, P>): Action<S, P>;
}

interface Component<Props, ComponentState, MainState> {
    (props: Props & RequiredProps<MainState>, children: Children[]): VNode | null;
    componentName: string;

    context(id?: IdValue): ComponentContext;
    destroyState(state: MainState, id?: IdValue): MainState;
    destroyAllStates(state: MainState): MainState;
    // slice(state: MainState, id?: IdValue): ComponentState | undefined;
}

interface ComponentParam<Props, PState, MainState> {
    name?: string;
    init?: () => PState;
    view: (c: ComponentContext, partialState: PState, props: Props & RequiredProps<MainState>, children: Children[]) => VNode | null;

    mountToAppState?: boolean;
    // unique?: boolean;
}

export function component<Props, ComponentState, MainState>(params: ComponentParam<Props, ComponentState, MainState>): Component<Props, ComponentState, MainState>;