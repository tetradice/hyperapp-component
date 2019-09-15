# hyperapp-component

`hyperapp-component` is plugin to enhance stateful component for [Hyperapp V2](https://github.com/jorgebucaran/hyperapp).

It is composed a hyperapp middleware and function for creating component.


# Features

- Stateful component support
- API as small and easy to learn as possible
- "True one state" does not break - the state of each component is combined in the app state
- Can also be used module-like (there is only one component and state in the entire app)

# Prerequisites for using

- __App state is object__ (not number, string, boolean, etc.)

# Install

```sh
# for npm
% npm install --save-dev hyperapp-component

# for Yarn
% yarn add -D hyperapp-component
```

# Usage

1. Add `componentHandler` to `middleware` argument of `app()`.

    ```jsx
    import { componentHandler } from "hyperapp-component";

    app({
        ...

        middleware: componentHandler
    })
    ```

    - If you multiple middleware, use `compose()` at [@hyperapp/middlewares (by sergey-shpak)](https://github.com/sergey-shpak/hyperapp-middlewares).
    
        ```jsx
        import { h, app } from "hyperapp";
        import { componentHandler } from "hyperapp-component";
        import logger from "hyperapp-v2-basiclogger";
        import { compose } from "@hyperapp/middlewares";

        app({
            ...
            middleware: compose(logger, componentHandler)
        });
        ```

2. Define your component by `component()` function. (the example below uses ES6 and JSX)

    ```jsx
    import { component } from "hyperapp-component";

    const UpdateComponentValue = (cState, value) => {
        return { ...cState, value: value };
    }

    export var MyTextBox = component({
          view: (c, cState, props, children) => {
            return <input type="text" value={cState.value} onchange={[c(UpdateComponentValue), (e) => e.target.value]} />
          }
        , init: () => ({ value: "" })
        , name: "MyTextBox"
    });
    ```

    Its function has 3 main parameters. (similar to `app()`)

    - `view` is required. This is a function that takes the following 4 arguments and returns a VNode.
        - `c` is component context. By using it like `c(Action)` or  `[c(Action), payload]`, the result of the action is reflected in the component state  (not the main state of the app).
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


    - `init` is optional. This is a function that returns initial component state. If omitted, the initial component state is `undefined`.
    - `name` is optional. This is used as a key to store component state, so it is recommended to specify it as much as possible.

3. And use it.

    ```jsx
    app({
        view: (state) => (
            <div>
                <MyTextBox state={state} id={1} />
                <MyTextBox state={state} id={2} />
                <MyTextBox state={state} id={3} />
            </div>
        );
    });
    ```

    A component has two special attributes -- `state` and `id`.

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

`hyperapp-component` manages the state of each component by integrating it into the app state. They are encapsulated and should normally not be accessed outside of component actions.

However, by using `mountProperty` option, you can assign component states to specific properties of app state and access them from the outside. (Described later)



## Dispatch component action

If you want to dispatch an action and update a component state, you should wrap the action with `c` function.

```jsx
import { component } from "hyperapp-component";

const UpdateComponentValue = (cState, value) => {
    return { ...cState, value: value };
}

export var MyTextBox = component({
      view: (c, cState, props, children) => {
          return <input type="text" value={cState.value} onchange={[c(UpdateComponentValue), (e) => e.target.value]} />
      }
    , init: () => ({ value: "" })
    , name: "MyTextBox"
});
```

`c(Action)` is __component action__. It updates only component state.

When updating the component state, one of the following is specified for `on*` handler attribute.


```js
c(Action) // without custom payload
[c(Action), payload] // with custom payload (or payload creator)
```


## Nested components

If you want to nest components, pass `props.state` to the subcomponent. (__Not `cState`__)

```jsx
import { component } from "hyperapp-component";

var MySubTextBox = component({
      view: (c, cState) => {
          return <input type="text" value={cState.value} />
      }
    , init: () => ({ value: "" })
    , name: "MySubTextBox"
});

export var MyTextBox = component({
      view: (c, cState, props) => {
          return <MySubTextBox state={props.state}  />
      }
    , init: () => ({ value: "" })
    , name: "MyTextBox"
});
```

## Destroy component states

Unlike React, A does not automatically destroy component states that are no longer needed. Therefore, if you want to destroy them, you should use the following functions or effects.

- functions (receives app state and return new app state, it is immutable)
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
import { component } from "hyperapp-component";
import { MyTextBox } from "./MyTextBox";

const BreakTextBox = (state, value) => {
    if(state.textBoxCount >= 1){
        var destroyedId = state.textBoxCount - 1;
        var newState = {...state, textBoxCount: state.textBoxCount - 1};
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
    init: {textBoxCount: 5}
    view: (state) => {
        var textBoxes = [];
        for(var i = 0; i < state.textBoxCount; i++){
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
    );
});
```

## Module-like

By using without setting the id, you can use it in module-like. ("module-like" here means that there is always only one in the application and multiple instances cannot be created)

```jsx
<Module1 state={state} />
```

In this case, since no key is set, one component state is shared by all the places where Module1 is called.


## TypeScript support



## Advanced: Get or update component state from outside by API

You can also get or update component state from outside the component view. This is useful if you want to modularize your app.
This is useful if you want to modularize your app and split it into multiple parts for each function.

To get component state, use `MyComponent.slice` to extract the component status from the app status.

To update component state, use `MyComponent.context` to dispatch component action.

## Option: Mount to app state

As mentioned above, by using `mountToAppState` option, you can assign component states to specific properties of app state and access them from the outside.

```jsx
import { component } from "hyperapp-component";

const UpdateComponentValue = (cState, value) => {
    return { ...cState, value: value };
}

var MyTextBox = component({
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
var MyModule1 = component({
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