import { Middleware, VNode, Action, Dispatchable, Children, Effect } from "hyperapp";

declare const componentHandler: Middleware;

type IdValue = string | number | undefined;

interface SpecialProps<MainState> {
    id?: IdValue;
    state: MainState;
}

interface ComponentContext {
    <S, P>(action: Action<S, P>): Action<S, P>;
}

interface Component<Props, ComponentState, MainState> {
    (props: Props & SpecialProps<MainState>, children: Children[]): VNode | null;

    slice(state: MainState, id?: IdValue): ComponentState | undefined;

    context<P>(id: IdValue, action: Action<ComponentState, P>): typeof action;
    context(id?: IdValue): ComponentContext;

    destroy(state: MainState, ids: IdValue[]): MainState;
    destroy(state: MainState, idPattern: RegExp): MainState;
    destroy(state: MainState, id?: IdValue): MainState;
    destroyAll(state: MainState): MainState;

    destroyEffect(ids: IdValue[]): Effect<MainState>;
    destroyEffect(idPattern: RegExp): Effect<MainState>;
    destroyEffect(id?: IdValue): Effect<MainState>;
    destroyAllEffect(): Effect<MainState>;
}

interface ComponentParam<Props, PState, MainState> {
    name?: string;
    init?: () => PState;
    view: (c: ComponentContext, partialState: PState, props: Props & SpecialProps<MainState>, children: Children[]) => VNode | null;

    mountToAppState?: boolean;
    singleton?: boolean;
}

export function component<Props, ComponentState, MainState>(params: ComponentParam<Props, ComponentState, MainState>): Component<Props, ComponentState, MainState>;