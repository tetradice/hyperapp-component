"use strict";

var componentParams = {};

function encode(str){
    return str.replace(/\/|%2F/g, function(m){
        return (m === '/' ? '%2F' : '%%2F')
    });
}

function makePathString(path) {
    return path.join("/");
}

function getPartialState(init, state, path) {
    if (state["__components__"] && state["__components__"][path]) {
        return state["__components__"][path];
    }
    if (init) {
        return init();
    } else {
        return undefined;
    }
}

export function componentHandler(baseDispatch) {
    var currentState = undefined;

    var newDispatch = function (target, props) {
        if (Array.isArray(target)) {
            if (typeof target[0] === 'object' && target[0]['__componentContext__']) {
                var context = target[0];
                var params = componentParams[context.name];

                if (typeof target[1] === 'function') {
                    // action
                    var action = target[1];
                    var payload = target[2];
                    var partialState = getPartialState(params.init, currentState, context.path);

                    var actionResult;
                    if (typeof payload === 'function') {
                        // payload creator
                        actionResult = action(partialState, payload(props));
                    } else if (payload !== undefined) {
                        // custom payload
                        actionResult = action(partialState, payload);
                    } else {
                        // default payload
                        actionResult = action(partialState, props);
                    }

                    if (Array.isArray(actionResult)) {
                        return newDispatch([context].concat(actionResult), props);
                    } else {
                        return newDispatch([context, actionResult], props);
                    }
                } else {
                    // new state
                    var newPartialState = target[1];

                    var newState = Object.assign({}, currentState);
                    if (newState["__components__"] === undefined) {
                        newState["__components__"] = {};
                    }
                    newState["__components__"][context.path] = newPartialState;
                    currentState = newState;
                    return baseDispatch(newState, props); // TODO: Effect
                }
            } else {
                currentState = target[0];
                return baseDispatch(target, props);
            }
        } else if (typeof target === 'object') {
            currentState = target;
            return baseDispatch(target, props);
        } else {
            return baseDispatch(target, props);
        }
    }

    return newDispatch;
}

var encodedPathList = [];

export function component(params) {
    // Decide name
    var baseName = (params.name || 'Unnamed');
    var name = baseName;
    for (var i = 2; true; i++) {
        if (componentParams[name] === undefined) {
            break;
        } else {
            name = baseName + "_" + i.toString();
        }
    }

    // Generate component function
    var newComponent = function (props, children) {
        var key = (props.key === undefined ? '' : props.key);
        encodedPathList.push(encode(name), encode(key));

        var path = makePathString(encodedPathList);
        var partialState = getPartialState(params.init, props.state, path);

        var context = { "__componentContext__": true, name: name, key: key, path: path };
        var result = params.view(context, partialState, props, children);

        encodedPathList.pop();
        encodedPathList.pop();

        return result;
    };

    // Store params
    componentParams[name] = params;

    return newComponent;
}