"use strict";

var componentParams = {};

function getPartialState(init, state, componentName, id) {
    if (state["__components__"] && state["__components__"][componentName] && state["__components__"][componentName][id]) {
        return state["__components__"][componentName][id];
    }
    if (init) {
        return init();
    } else {
        return undefined;
    }
}

function mergePartialState(context, state, partialState){
    var newState = objectAssign({}, state);
    if (newState["__components__"] === undefined) {
        newState["__components__"] = {};
    }
    if (newState["__components__"][context.name] === undefined) {
        newState["__components__"][context.name] = {};
    }
    newState["__components__"][context.name][context.id] = partialState;

    return newState;
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
            && state["__components__"][props.componentName] !== undefined) {
            newState = objectAssign({}, state);
            newState["__components__"] = objectAssign({}, newState["__components__"]);
            newState["__components__"][props.componentName] = objectAssign({}, newState["__components__"][props.componentName]);
            delete newState["__components__"][props.componentName][props.id];
        }
    }
    return newState;
}

var ComponentDestroyRunner = function(dispatch, props) {
    dispatch(ComponentDestroyAction, props);
}

function GetStateAction(state){
    return state;
}

function dispatchComponentAction(dispatch, context, payload, props){
    var params = componentParams[context.name];
    var action = context.action;
    var state = dispatch(GetStateAction);
    var partialState = getPartialState(params.init, state, context.name, context.id);

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

    // Does result includes state?
    if (Array.isArray(actionResult) && typeof actionResult[0] === 'object' && !actionResult[0]['__componentContext__']) {
        // new state with effects
        var newPartialState = actionResult[0];
        var newState = mergePartialState(context, state, newPartialState);

        return dispatch([newState].concat(actionResult.slice(1)));

    } else if (!Array.isArray(actionResult) && typeof actionResult === 'object' && !actionResult['__componentContext__']) {
        // new state without effects
        var newPartialState = actionResult;
        var newState = mergePartialState(context, state, newPartialState);

        return dispatch(newState);

    } else {
        // no state
        return dispatch(actionResult);
    }
}

export function componentHandler(baseDispatch) {
    var newDispatch = function (target, props) {
        if (Array.isArray(target) && typeof target[0] === 'object' && target[0]['__componentContext__']) {
            // component action (with payload)
            return dispatchComponentAction(newDispatch, target[0], target[1], props);
        } else if (!Array.isArray(target) && typeof target === 'object' && target['__componentContext__']){
            // component action
            return dispatchComponentAction(newDispatch, target, undefined, props);
        } else {
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
        var id = (props.id === undefined ? '' : props.id);

        var partialState = getPartialState(params.init, props.state, name, id);

        var c = function(baseAction){
            return { "__componentContext__": true, action: baseAction, name: name, id: id }
        };
        var result = params.view(c, partialState, props, children);

        return result;
    };

    // set destroy effect
    newComponent.destroyState = function(id){
        return [ComponentDestroyRunner, { componentName: name, id: id }];
    }

    newComponent.destroyAllStatus = function (id) {
        return [ComponentDestroyRunner, { componentName: name, all: true }];
    }

    // Store params
    componentParams[name] = params;

    return newComponent;
}