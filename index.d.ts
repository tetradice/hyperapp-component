declare const componentHandler: hyperappSubset.Middleware;

type IdValue = string | number | undefined;

interface SpecialProps<MainState> {
    id?: IdValue;
    state: MainState;
}

interface ComponentAction<ComponentState, Payload = void, MainState = unknown> {
    (state: ComponentState, data: Payload): ComponentActionResult<ComponentState, MainState>;
}

interface ComponentContext<ComponentState, MainState> {
    <P>(action: ComponentAction<ComponentState, P, MainState>): hyperappSubset.Action<MainState, P>;
}

interface Component<Props, ComponentState, MainState> {
    (props: Props & SpecialProps<MainState>, children: hyperappSubset.Children[]): hyperappSubset.VNode | null;

    slice(state: MainState, id?: IdValue): ComponentState | undefined;
    context<P>(id: IdValue, action: ComponentAction<ComponentState, P, MainState>): hyperappSubset.Action<MainState, P>;
    context(id?: IdValue): ComponentContext<ComponentState, MainState>;

    destroy(state: MainState, ids: IdValue[]): MainState;
    destroy(state: MainState, idPattern: RegExp): MainState;
    destroy(state: MainState, id?: IdValue): MainState;
    destroyAll(state: MainState): MainState;

    destroyEffect(ids: IdValue[]): hyperappSubset.Effect<MainState>;
    destroyEffect(idPattern: RegExp): hyperappSubset.Effect<MainState>;
    destroyEffect(id?: IdValue): hyperappSubset.Effect<MainState>;
    destroyAllEffect(): hyperappSubset.Effect<MainState>;
}

interface ComponentWithInit<Props, ComponentState, MainState> extends Component<Props, ComponentState, MainState> {
    slice(state: MainState, id?: IdValue): ComponentState;
}

interface SingletonComponent<Props, ComponentState, MainState> {
    (props: Props & Omit<SpecialProps<MainState>, "id">, children: hyperappSubset.Children[]): hyperappSubset.VNode | null;

    slice(state: MainState): ComponentState | undefined;

    context<P>(id: undefined, action: ComponentAction<ComponentState, P>): typeof action;
    context(): ComponentContext<ComponentState, MainState>;

    destroy(state: MainState): MainState;
    destroyAll(state: MainState): MainState;

    destroyEffect(): hyperappSubset.Effect<MainState>;
    destroyAllEffect(): hyperappSubset.Effect<MainState>;
}

interface SingletonComponentWithInit<Props, ComponentState, MainState> extends SingletonComponent<Props, ComponentState, MainState> {
    slice(state: MainState, id?: IdValue): ComponentState;
}

interface ComponentParam<Props, ComponentState, MainState> {
    name?: string;
    init?: () => ComponentState;
    view: (
        c: ComponentContext<ComponentState, MainState>,
        cState: ComponentState,
        props: Props & SpecialProps<MainState>,
        children: hyperappSubset.Children[]
    ) => hyperappSubset.VNode | null;

    mountToAppState?: boolean;
    singleton?: boolean;
}

export function component<Props, ComponentState, MainState = unknown>(
    params: ComponentParam<Props, ComponentState, MainState> & { init: () => ComponentState, singleton: true }
): SingletonComponentWithInit<Props, ComponentState, MainState>;

export function component<Props, ComponentState, MainState = unknown>(
    params: ComponentParam<Props, ComponentState, MainState> & { singleton: true }
): SingletonComponent<Props, ComponentState, MainState>;

export function component<Props, ComponentState, MainState = unknown>(
    params: ComponentParam<Props, ComponentState, MainState> & { init: () => ComponentState }
): ComponentWithInit<Props, ComponentState, MainState>;

export function component<Props, ComponentState, MainState = unknown>(
    params: ComponentParam<Props, ComponentState, MainState>
): Component<Props, ComponentState, MainState>;

export type ComponentActionResult<ComponentState, MainState = unknown> =
    | ComponentState
    | [ComponentState, ...hyperappSubset.Effect<MainState>[]]
    | hyperappSubset.Dispatchable<MainState>;

declare namespace hyperappSubset {
    export interface VNode {
        name: unknown; // protected (internal implementation)
        props: unknown; // protected (internal implementation)
        children: unknown; // protected (internal implementation)
        node: unknown; // protected (internal implementation)
        type: unknown; // protected (internal implementation)
        key: unknown; // protected (internal implementation)
        lazy: unknown; // protected (internal implementation)
    }

    export type Children = VNode | string | number | null

    type PayloadCreator<DPayload, CPayload> = ((data: DPayload) => CPayload);

    export type Dispatchable<State, DPayload = void, CPayload = any> = (
        ([Action<State, CPayload>, PayloadCreator<DPayload, CPayload>])
        | ([Action<State, CPayload>, CPayload])
        | Action<State, void> // (state) => ({ ... }) | (state) => ([{ ... }, effect1, ...])
        | Action<State, DPayload>  // (state, data) => ({ ... })  | (state, data) => ([{ ... }, effect1, ...])
    );

    export type Dispatch<State, NextPayload = void> = (obj: Dispatchable<State, NextPayload>, data: NextPayload) => State;

    export interface EffectRunner<State, NextPayload, Props> {
        (dispatch: Dispatch<State, NextPayload>, props: Props): void;
    }

    export type Effect<State = any> = [EffectRunner<State, any, any>, any];

    export interface SubscriptionRunner<State, NextPayload, Props> {
        (dispatch: Dispatch<State, NextPayload>, props: Props): (() => void);
    }

    export type Subscription<State = any> = [SubscriptionRunner<State, any, any>, any];

    export type ActionResult<State> = (State | [State, ...Effect<State>[]] | Dispatchable<State>);

    export interface Action<State, Payload = void> {
        (state: State, data: Payload): ActionResult<State>;
    }

    export type SubscriptionsResult<State> = | (Subscription<State> | boolean)[] | Subscription<State> | boolean;

    export type Subscriptions<State> = (state: State) => SubscriptionsResult<State>;

    export type MiddlewareFunc<State = any> = (action: State | Dispatchable<State>, props: unknown) => void;

    export type Middleware<State = any> = (func: MiddlewareFunc<State>) => MiddlewareFunc<State>;
}