# hyperapp-v2-modularize

`hyperapp-v2-modularize` enhances module system for [hyperapp V2](https://github.com/jorgebucaran/hyperapp).

It is composed a middleware and functional component.


# Features

- Simple API
- Stateful component support
- "True one state" does not break - the state of each component is combined in the main state.


# Limitation

In order to use A, there are some additional restrictions on app state.

- App state must be object. (number, string, boolean, etc. cannot be used) This is to keep the internal state of the component in state.


## Contact
@tetradice ([GitHub Issues](https://github.com/tetradice/hyperapp-v2-modularize/issues) or [Twitter](https://twitter.com/tetradice))


## License
Unlicensed