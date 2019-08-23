# hyperapp-v2-component

`hyperapp-v2-component` is plugin to enhance stateful component for [hyperapp V2](https://github.com/jorgebucaran/hyperapp).

It is composed a hyperapp middleware and function for creating component.


# Features

- Simple API
- Stateful component support
- "True one state" does not break - the state of each component is combined in the main state.
- nestable (component in component)

# Limitation

In order to use A, there are some additional restrictions on app state.

- App state must be object. (number, string, boolean, etc. cannot be used) This is to keep the internal state of the component in state.


## Contact
@tetradice ([GitHub Issues](https://github.com/tetradice/hyperapp-v2-component/issues) or [Twitter](https://twitter.com/tetradice))


## License
Unlicensed