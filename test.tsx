import { Action, h, Effect, EffectRunner, app, View, Component, Dispatchable, Dispatch, Subscription } from "hyperapp";
import { compose } from "@hyperapp/middlewares";
import logger from "hyperapp-v2-basiclogger";
import { componentHandler, component } from ".";

interface State {
    count: number;
    deleted: {[id: number]: boolean}
}

const Increment1: Action<State> = (state) => Increment(state, { value: 1 });
const Increment: Action<State, { value: number }> = (state, payload) => ({
    ...state,
    count: state.count + payload.value
});

const TimeoutRunner = function<S>(dispatch: Dispatch<S>, props: { action: Dispatchable<S> }){
    setTimeout(function(){ dispatch(props.action) }, 1000);
}

function timeout<S>(action: Dispatchable<S>): Effect<S>{
    return [TimeoutRunner, {action: action}];
}

const IntervalRunner = function <S>(dispatch: Dispatch<S>, props: { action: Dispatchable<S> }) {
    let id = setInterval(function () { dispatch(props.action) }, 3000);
    return () => clearInterval(id);
}

function interval<S>(action: Dispatchable<S>): Subscription<S> {
    return [IntervalRunner, { action: action }];
}



const RemoveButtonAct: Action<State, number> = (state, id) => {
    let newState = {
        ...state
        , deleted: {
            ...state.deleted
            , [id]: true
        }
    };
    newState = TextBox.destroyState(newState, id);
    
    return newState;
};

const UpdateValueDelayed: Action<{ value: string }, { value: string, c: object}> = (state, payload) => ([state, timeout([payload.c, UpdateValue, payload.value] as any)]);
const UpdateValue: Action<{ value: string }, string> = (state, payload) => ({ ...state, value: payload });
const NonAction = function<S>(state: S){ return state };


const RemoveButton = (props: { onclick: any }) => {
    return (<button type="submit" onclick={props.onclick} class="btn btn-danger"><i class="fas fa-times fa-lg"></i> 削除</button>);
}

const TextBox = component<{}, {value: string}, State>({
      init: () => ({ value: "def" })
    , view: (c, mState, props) => {
        return (
            <div class="form-group">
                <label>{props.id}</label>
                <input type="text" class="form-control" value={mState.value} onchange={[c(UpdateValue), (e: Event) => ((e.target as any).value)]} />
                <RemoveButton onclick={[RemoveButtonAct, props.id]} />
                <button onclick={NonAction}>何もしない</button>
            </div>
        )
    }
    , name: "TextBox"
    , mountToAppState: true
});


const view: View<State> = (state) => {
    return (
        <div>
            {state.deleted[1] ? null : <TextBox id={1} state={state} />}
            {state.deleted[2] ? null : <TextBox id={2} state={state} />}
            {state.deleted[3] ? null : <TextBox id={3} state={state} />}
            {state.deleted[4] ? null : <TextBox id={4} state={state} />}
        </div>
    );
}

app({
      init: {count: 0, deleted: {}}
    , view: view
    , node: document.getElementById('app')!
    , middleware: compose(componentHandler, logger)
});