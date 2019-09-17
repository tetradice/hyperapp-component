# hyperapp-component

`hyperapp-component` is plugin to enhance stateful component and module for [Hyperapp V2](https://github.com/jorgebucaran/hyperapp).

It is composed a hyperapp middleware and function for creating component.

You can try it online demos (powered by CodeSandbox):

- [Simple example](https://codesandbox.io/s/hyperapp-component-demo-simple-76fzm?fontsize=14&module=%2Findex.jsx)
- [Calculator](https://codesandbox.io/s/hyperapp-component-demo-calclator-soznz?fontsize=14&module=%2Findex.jsx)
- [Calculator (on TypeScript)](https://codesandbox.io/s/hyperapp-component-demo-calclator-typescript-tozfi?fontsize=14&module=%2Findex.tsx)

# Features

- Stateful component support
- "True one state" does not break - the state of each component is combined in the app state
- Can also be used module-like (there is only one component and state in the entire app)
- Built-in TypeScript support

# Prerequisites for using

- __App state must be object__ (not number, string, boolean, etc.)

# Install

```sh
# for npm
% npm install --save-dev hyperapp-component

# for Yarn
% yarn add -D hyperapp-component
```

# Usage

(Note: In the following code examples, ES6 and JSX are used)

1. Add `componentHandler` to `middleware` parameter of `app()`.

    ```jsx
    import { h, app } from "hyperapp";
    import { componentHandler } from "hyperapp-component";

    app({
        ...

        middleware: componentHandler
    })
    ```

    - If you multiple middleware, use `compose()` at [@hyperapp/middlewares (by sergey-shpak)](https://github.com/sergey-shpak/hyperapp-middlewares).
    
        ```jsx
        import { compose } from "@hyperapp/middlewares";
        import { componentHandler } from "hyperapp-component";
        import logger from "hyperapp-v2-basiclogger";

        app({
            ...
            middleware: compose(logger, componentHandler)
        });
        ```

2. Define your component by `component()` function.

    ```jsx
    import { h } from "hyperapp";
    import { component } from "hyperapp-component";

    const UpdateComponentValue = (cState, value) => {
        return { ...cState, value: value };
    }

    export const MyTextBox = component({
          view: (c, cState, props, children) => {
            return <input type="text"
                          value={cState.value}
                          onchange={[c(UpdateComponentValue), (e) => e.target.value]} />
          }
        , init: () => ({ value: "" })
        , name: "MyTextBox"
    });
    ```

    Its function has 3 main parameters. (similar to `app()`)

    - `view` is required. This is a function that takes the following 4 arguments and returns a VNode.
        - `c` is component context. By using it like `c(Action)` or  `[c(Action), payload]`, the result of the action is reflected in the component state (not the main state of the app).
        - `cState` is component state. It is held for each component.
        - `props` and `children` are attributes and child elements that are passed when the component is called, just like a normal component.

            ```jsx
            <MyTextBox id={1} state={appState} type="labeled"><span>label text</span></MyTextBox>

            // props -> {id: 1, state: appState, type: "labeled"} (object)
            // children -> [<span>label text</span>] (array of VNode)
            ```

            These arguments may not be received if not required.

            ```jsx
                , view: (c, cState) => {
                   ...
                }
            ```


    - `init` is optional. This is a function that returns initial component state. If omitted, the initial component state is `undefined`.
    - `name` is optional. This is used as a key to store component state, so it is recommended to specify it as much as possible.

3. And use it.

    ```jsx
    import { h, app } from "hyperapp";
    import { componentHandler } from "hyperapp-component";
    import { MyTextBox } from "./components/MyTextBox";
    
    app({
        init: {},
        view: (state) => (
            <div>
                <MyTextBox state={state} id={1} />
                <MyTextBox state={state} id={2} />
                <MyTextBox state={state} id={3} />
            </div>
        ),
        node: document.getElementById("app"),
        middleware: componentHandler
    });
    ```

    A component receives two special attributes -- `state` and `id`.

    - `state` is required. Just pass the app state. (Since component state is included in app state, it needs to be passed to get component state)
    - `id` is a value that is a number or string that is used as a key to hold the component state. If there are two or more components of the same type, a unique key must be specified for each component. __This value must be unique in the entire app.__
    
        If there is only one component in the app, `id` can be omitted.

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

## Component state

`hyperapp-component` manages the state of each component by integrating it into the app state. They are encapsulated and should normally not be accessed directly outside of component actions.

However, by using `mountToAppState` option, you can assign component states to specific properties of app state and access them from the outside. (Described later)

## Nested components

If you want to nest components, pass `props.state` to the subcomponents. (__Not `cState`__)

```jsx
import { component } from "hyperapp-component";

const MySubTextBox = component({
      view: (c, cState) => {
          return <input type="text" value={cState.value} />
      }
    , init: () => ({ value: "" })
    , name: "MySubTextBox"
});

export const MyTextBox = component({
      view: (c, cState, props) => {
          return <MySubTextBox state={props.state}  />
      }
    , init: () => ({ value: "" })
    , name: "MyTextBox"
});
```

## Destroy component states

Unlike React, A does not automatically destroy component states that are no longer needed. Therefore, if you want to destroy them, you should use the following functions or effects.

- action functions (receives app state and return new app state. they are immutable)
    - `MyComponent.destroy(state, id)`
    - `MyComponent.destroy(state, [id1, id2, ...])`
    - `MyComponent.destroy(state, /idPattern/)`
    - `MyComponent.destroyAll(state)` (destroy all id states)
- effects (not receives app state)
    - `MyComponent.destroyEffect(id)`
    - `MyComponent.destroyEffect([id1, id2, ...])`
    - `MyComponent.destroyEffect(/idPattern/)`
    - `MyComponent.destroyAllEffect()` (destroy all id states)

```jsx
import { h, app } from "hyperapp";
import { component } from "hyperapp-component";
import { MyTextBox } from "./components/MyTextBox";

const BreakTextBox = (state, value) => {
    if(state.textBoxCount >= 1){
        let destroyedId = state.textBoxCount - 1;
        let newState = {...state, textBoxCount: state.textBoxCount - 1};
        newState = MyTextBox.destroy(newState, destroyedId);
        return newState;
    } else {
        return state;
    }
}

const BreakAllTextBox = (state, value) => {
    return [{...state, textBoxCount: 0}, MyTextBox.destroyAllEffect()];
}

app({
    init: {textBoxCount: 5},
    view: (state) => {
        let textBoxes = [];
        for(let i = 0; i < state.textBoxCount; i++){
            textBoxes.push(
                <div>
                    <MyTextBox state={state} id={i} />
                </div>
            );
        };
        return (
            <div>
                {textBoxes}
                <button onclick={BreakTextBox}>Break 1 TextBox</button>
                <button onclick={BreakAllTextBox}>Break All TextBoxes</button>
            </div>
        )
    },
    node: document.getElementById("app"),
    middleware: componentHandler
});
```

## TypeScript support

`hyperapp-component` has built-in support for TypeScript, so you can use it on TypeScript.

- Note: __hyperapp V2 does not yet officially support TypeScript__, and you cannot use the released version of Hyperapp V2 in TypeScript. (As of September 16, 2019)

    If you want to use hyperapp V2 on TypeScript at this time, you need to use Yarn and install hyperapp V2 from the branch I have published.

    ```bash
    # for Yarn
    % yarn add -D https://github.com/tetradice/hyperapp#typescript-declarations-improvement
    ```

    (I'm sending a Pull Request to hyperapp V2, so if it's adopted, you'll be able to use TypeScript in the release version of Hyperapp V2)

When using with TypeScript, write as follows.

```tsx
import { h } from "hyperapp";
import { component, ComponentActionResult } from "hyperapp-component";
import { AppState } from "../typings/state";  // type AppState = { ... };

type CState = { value: string }

const UpdateComponentValue: ComponentAction<CState, string, AppState> = (cState, value) => {
    return { ...cState, value: value };
}

export const MyTextBox = component<{}, CState, AppState>({
    view: (c, cState, props, children) => {
        return <input type="text"
                      value={cState.value}
                      onchange={[c(UpdateComponentValue), (e) => (e.target as any).value]} />
    }
    , init: () => ({ value: "" })
    , name: "MyTextBox"
});
```

If you want to define a component action, use `ComponentAction<ComponentState, Payload, AppState>`.

- `Payload` represents the type of payload that the Action can accept. If omitted, it is `void` (does not accept Payload).
- `AppState` represents the type of app state, not its component state. This may be used by Effect in the case of Action with Effect.
  If the component can be used for any app, it can be omitted and the default value is `unknown` if omitted.

If you define a type in TypeScript, you need to specify the type in the `component()` function.

```ts
component<Props, ComponentState, AppState>({
    ...
})
```

- `AppState` represents the state of app as above. This also applies to the `props.state` type.

## Advanced: Module-like

By using without setting the `id`, you can use it in module-like. ("module-like" here means that there is always only one in the application and multiple instances cannot be created)

```jsx
<Module1 state={state} />
```

In this case, since `id` is not set, one component state is shared by all the places where `Module1` is called.


## Advanced: Get or update component state from outside by API

You can also get or update component state from outside the component view.
This is useful if you want to modularize your app and split it into multiple parts for each function.

To get component state, use `MyComponent.slice(id)` to extract the component state from the app state.

To update component state, use `MyComponent.context()` to dispatch component action.

```jsx
import { h, app } from "hyperapp";
import { componentHandler } from "hyperapp-component";
import { MyTextBox } from "./components/MyTextBox";

app({
    init: {},
    view: (state) => {
        let textBox2State = MyTextBox.slice(state, 2);  // Get the component state of MyTextBox (ID=2) from app state

        return (
            <div>
                <MyTextBox state={state} id={1} />
                <MyTextBox state={state} id={2} />
                <MyTextBox state={state} id={3} />

                <button onclick={MyTextBox.context(2, Action1)}>Update 2nd text box</button>   // Update the state of MyTextBox with (ID=2) using Action1
                <button onclick={MyTextBox.context(2)(Action1)}>Update 2nd text box</button>   // Same as above
            </div>
        );
    },
    node: document.getElementById("app"),
    middleware: componentHandler
});
```

## Option: Mount to app state

As mentioned above, by using `mountToAppState` option, you can assign component states to specific properties of app state and access them from the outside.

```jsx
import { component } from "hyperapp-component";

const UpdateComponentValue = (cState, value) => {
    return { ...cState, value: value };
}

const MyTextBox = component({
        view: (c, cState, props, children) => {
        return <input type="text" value={cState.value} onchange={[c(UpdateComponentValue), (e) => e.target.value]} />
        }
    , init: () => ({ value: "" })
    , name: "MyTextBox"
    , mountToAppState: true
});

app({
      init: {}
    , view: (state) => (
        <div>
            <MyTextBox state={state} id={1} />
            <MyTextBox state={state} id={2} />
            <MyTextBox state={state} id={3} />
        </div>
    );
});
```

In the above case, if the user changes the contents of the second text box to "NEW TEXT", the app state will be:

```js
{
    MyTextBox: {
        2: {
            value: "NEW TEXT";
        } 
    }
}
```




## Option: Singleton restriction (more module-like)

By specifying the `singleton` option, you can guarantee that there is only one component in the entire app.

(You can call a component in multiple places, but you can't give a different state for each place you call)

```js
const MyModule1 = component({
      view: (c, cState, props, children) => {
        return <div> ... </div>
      }
    , init: () => ({ prop1: "", prop2: "" })
    , name: "MyModule1"
    , mountToAppState: true
    , singleton: true
});
```

This will change the behavior as follows:

1. Passing an id to component is forbidden. If you do, an exception will occur.

    ```jsx
    <MyModule1 state={state} />  // OK
    <MyModule1 state={state} id="foo" />  // Error!
    ```

2. The structure of the app state changes to be suitable for singleton. This is mainly meaningful when combined with `mountToAppState` option.

    ```js
    // mountToAppState: true, singleton: false (or omitted)
    {
        ...
        MyModule1: {
            "": {   // If id is omitted, id is an empty string.
                prop1: "",
                prop2: ""
            }
        }
    }

    // mountToAppState: true, singleton: true
    {
        ...
        MyModule1: {
            prop1: "",
            prop2: ""
        }
    }
    ```

3. If you use TypeScript, the type definition will also change to not accept an id.

    ```ts
    <MyModule1 state={state} id="foo" />  // A build error occurs
    ```



## Contact
@tetradice ([GitHub Issues](https://github.com/tetradice/hyperapp-component/issues) or [Twitter](https://twitter.com/tetradice))


## License
Unlicensed