"use strict";

var componentParams = {};

function getPartialState(init, state, componentName, key) {
    if (state["__components__"] && state["__components__"][componentName] && state["__components__"][componentName][key]) {
        return state["__components__"][componentName][key];
    }
    if (init) {
        return init();
    } else {
        return undefined;
    }
}

// from MDN <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign>
function objectAssign(target, varArgs) { // .length of function is 2
    if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
            for (var nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
    }
    return to;
}

var ComponentDestroyAction = function(state, props){
    var newState = state;
    
    if(props.all){
        if(state["__components__"] !== undefined){
            delete newState["__components__"][props.componentName];
        }
    } else {
        if (state["__components__"] !== undefined
            && state["__components__"][componentName] !== undefined) {
            newState = objectAssign({}, state);
            newState["__components__"] = objectAssign({}, newState["__components__"]);
            newState["__components__"][props.componentName] = objectAssign({}, newState["__components__"][props.componentName]);
            delete newState["__components__"][props.componentName][props.key];
        }
    }
    return newState;
}

var ComponentDestroyRunner = function(dispatch, props) {
    dispatch(ComponentDestroyAction, props);
}

export function componentHandler(baseDispatch) {
    var currentState = undefined;

    var newDispatch = function (target, props) {
        if (Array.isArray(target)) {
            if (typeof target[0] === 'object' && target[0]['__componentContext__']) {
                // with component context
                var context = target[0];
                var params = componentParams[context.name];

                if (typeof target[1] === 'function') {
                    // action
                    var action = target[1];
                    var payload = target[2];
                    var partialState = getPartialState(params.init, currentState, context.name, context.key);

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
                    // new state (with effects)
                    var newPartialState = undefined;
                    var effects = undefined;
                    if (target.length >= 3) {
                        newPartialState = target[1];
                        effects = target.slice(2);
                    } else {
                        newPartialState = target[1];
                    }

                    var newState = objectAssign({}, currentState);
                    if (newState["__components__"] === undefined) {
                        newState["__components__"] = {};
                    }
                    if (newState["__components__"][context.name] === undefined) {
                        newState["__components__"][context.name] = {};
                    }
                    newState["__components__"][context.name][context.key] = newPartialState;
                    currentState = newState;

                    if (effects) {
                        return baseDispatch([newState].concat(effects), props);
                    } else {
                        return baseDispatch(newState, props);
                    }
                }
            } else if (typeof target === 'object') {
                // new state with effects
                currentState = target;
                return baseDispatch(target, props);
            } else {
                // action with custom payload
                return baseDispatch(target, props);
            }
        } else if (typeof target === 'object') {
            // new state without effects
            currentState = target;
            return baseDispatch(target, props);
        } else {
            // action
            return baseDispatch(target, props);
        }
    }

    return newDispatch;
}

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

        var partialState = getPartialState(params.init, props.state, name, key);

        var context = { "__componentContext__": true, name: name, key: key };
        var result = params.view(context, partialState, props, children);

        return result;
    };

    // set destroy effect
    newComponent.destroyState = function(key){
        return [ComponentDestroyRunner, { componentName: name, key: key }];
    }

    newComponent.destroyAllStatus = function (key) {
        return [ComponentDestroyRunner, { componentName: name, all: true }];
    }

    // Store params
    componentParams[name] = params;

    return newComponent;
}