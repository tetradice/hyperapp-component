import { Action, h, Effect, EffectFunc, app, View } from "hyperapp";
import { compose } from "@hyperapp/middlewares";
import logger from "hyperapp-v2-basiclogger";
import { modularize, createModule } from ".";

interface State { count: number }

const Increment1: Action<State> = (state) => Increment(state, { value: 1 });
const Increment: Action<State, { value: number }> = (state, payload) => ({
    ...state,
    count: state.count + payload.value
});


const UpdateValue: Action<{ value: string }, string> = (state, payload) => ({ ...state, value: payload });

const TextBox = createModule<{}, {value: string}>('TextBox', {
      init: () => ({ value: "def" })
    , view: (m, props, mState) => {
        return <input type="text" value={mState.value} onchange={[m, UpdateValue, (e: Event) => (e.target as any).value]} />
    }
});


const view: View<State> = (state) => {
    return (
        <div>
            <TextBox id={1} state={state} />
            <TextBox id={2} state={state} />
            <TextBox id={3} state={state} />
            <TextBox id={4} state={state} />
        </div>
    );
}

app({
      init: {count: 0}
    , view: view
    , node: document.getElementById('app')!
    , middleware: compose(modularize, logger)
});