# hyperapp-v2-component

`hyperapp-v2-component` is plugin to enhance stateful component for [Hyperapp V2](https://github.com/jorgebucaran/hyperapp).

It is composed a hyperapp middleware and function for creating component.


# Features

- Stateful component support
- API as small and easy to learn as possible
- "True one state" does not break - the state of each component is combined in the app state.
- Nestable (component in component)

# Prerequisites

- Hyperapp V2
- App state is object (not number, string, boolean, etc.)

# Install

```sh
% npm install --save-dev hyperapp-v2-component
```

# Usage

1. Add `componentHandler` to `middleware` argument of `app()`.

    ```jsx
    import { componentHandler } from "hyperapp-v2-component";

    app({
        ...

        middleware: componentHandler
    })
    ```

    - If you multiple middleware, you may use `compose()` function of [hyperapp-enhancer]().
    
        ```jsxtsx
            middleware: compose(componentHandler, logger)
        ```

2. Define your component by `component()` function.

    ```jsx
    import { component } from "hyperapp-v2-component";

    export var MyTextBox = component({
          name: "MyTextBox"
        , init: () => ({ value: "" })
        , view: (c, cState, props, children) => {
            return <input type="text" value={mState.value} onchange={[c, UpdateValue, (e) => e.target.value]} />
        }
    });
    ```

    Its function has 3 parameters. (similar to `app()`)

    - `view` is required.  This is a function that takes the following 4 arguments and returns a VNode.
        - `c` is component context. This is passed along with the Action function when the Action is dispatched.
        - `cState` is component state. It is held for each component.
        - `props` and `children` are attributes and child elements that are passed when the component is called, just like a normal component.

            ```jsx
            <MyTextBox type="labeled"><span>label text</span></MyTextBox>

            // props -> {type: "labeled"} (object)
            // children -> [<span>label text</span>] (array of VNode)
            ```

            These arguments may not be received if not required.

            ```jsx
                , view: (c, cState) => {
                    ...
                }
            ```


    - `name` is optional. This is used as a key to store component state, so it is recommended to specify it as much as possible.
    - `init` is optional. This is a function that returns initial component state. If omitted, the initial component state is `undefined`.

3. And use it.

    ```jsx
    app({
        view: (state) => (
            <div>
                <MyTextBox state={state} key={1} />
                <MyTextBox state={state} key={2} />
                <MyTextBox state={state} key={3} />
            </div>
        );
    });
    ```

    A component has two special attributes -- `state` and `key`.

    - `state` is required. Just pass the app state. (Since component state is included in app state, it needs to be passed to get component state)
    - `key` is a value is a number or string that is used as a key to hold the component state. If there are two or more components of the same type, a unique key must be specified for each component. If there is only one component, it may be optional.

        ```jsx
        app({
            view: (state) => (
                <div>
                    <MyUniqueTextBox state={state} />
                </div>
            );
        });
        ```

# Details

## Dispatch action

If you want to dispatch Action and component state, you should pass tuple to `on*` handler attributes. It has `c` (component context) at 1st item.

```jsx
import { component } from "hyperapp-v2-component";

var UpdateValue = (cState, inputValue) => ({
    value: inputValue
});

export var MyTextBox = component({
      name: "MyTextBox"
    , init: () => ({ value: "" })
    , view: (c, cState, props, children) => {
        return <input type="text" value={mState.value} onchange={[c, UpdateValue, (e) => e.target.value]} />
    }
});
```

When updating the component state, one of the following is specified for `on*` handler attribute.


```js
[c, Action] // without custom payload
[c, Action, payload] // with custom payload (or payload creator)
```

## Nested components

If you want to nest components, pass props.state to the subcomponent. (__Not cState__)

## Where is the component state stored?



## Limitation

In order to use A, there are some additional restrictions on app state.

- App state must be object. (number, string, boolean, etc. cannot be used) This is to keep the internal state of the component in state.


## Contact
@tetradice ([GitHub Issues](https://github.com/tetradice/hyperapp-v2-component/issues) or [Twitter](https://twitter.com/tetradice))


## License
Unlicensed