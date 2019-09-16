//@ts-check
"use strict";

var definedUnmountedComponentNames = {};

function getPartialState(componentName, componentParams, state, id) {
    if(id === undefined) id = "";

    if (componentParams.mountToAppState){
        if (state[componentName]
            && state[componentName][id]) {
            return state[componentName][id];
        }
    } else {
        if (state["__components__"]
            && state["__components__"][componentName]
            && state["__components__"][componentName][id]) {
            return state["__components__"][componentName][id];
        }
    }

    if (componentParams.init) {
        return componentParams.init();
    } else {
        return undefined;
    }
}

function mergePartialState(context, state, partialState){
    var newState = objectAssign({}, state);

    if(context.componentParams.mountToAppState){
        if (newState[context.componentName] === undefined) {
            newState[context.componentName] = {};
        }
        newState[context.componentName][context.id] = partialState;
    } else {
        if (newState["__components__"] === undefined) {
            newState["__components__"] = {};
        }
        if (newState["__components__"][context.componentName] === undefined) {
            newState["__components__"][context.componentName] = {};
        }
        newState["__components__"][context.componentName][context.id] = partialState;
    }
    
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

/**
 * Delete target from a state collection (object).
 */
function deleteTargetFromStates(states, target){
    if(target === undefined){
        delete states[''];
    } else if (typeof target.test === 'function') {
        // Regexp
        for (var id in states) {
            if (typeof id === 'string' && target.test(id)) {
                delete states[id];
            }
        }
    } else if (Array.isArray(target)) {
        // id array
        for (var i = 0; i < target.length; i++) {
            delete states[target[i]];
        }
    } else {
        // id
        delete states[target];
    }
}

function DestroyComponentStateRunner(dispatch, props){
    dispatch(DestroyComponentStateAction, props);
}

function DestroyComponentStateAction(state, props){
    var newState = state;
    
    if(props.all){
        if(props.componentParams.mountToAppState){
            newState = objectAssign({}, state);
            delete newState[props.componentName];
        } else {
            if (state["__components__"] !== undefined) {
                newState = objectAssign({}, state);
                delete newState["__components__"][props.componentName];
            }
        }
    } else {
        if (props.componentParams.mountToAppState) {
            if (state[props.componentName] !== undefined) {
                newState = objectAssign({}, state);
                newState[props.componentName] = objectAssign({}, newState[props.componentName]);

                deleteTargetFromStates(newState[props.componentName], props.target);
            }
        } else {
            if (state["__components__"] !== undefined
                && state["__components__"][props.componentName] !== undefined) {
                newState = objectAssign({}, state);
                newState["__components__"] = objectAssign({}, newState["__components__"]);
                newState["__components__"][props.componentName] = objectAssign({}, newState["__components__"][props.componentName]);

                deleteTargetFromStates(newState["__components__"][props.componentName], props.target);
            }
        }
    }

    return newState;
}

function GetStateAction(state){
    return state;
}

function dispatchComponentAction(dispatch, context, payload, props){
    var action = context.action;
    var state = dispatch(GetStateAction);
    var partialState = getPartialState(context.componentName, context.componentParams, state, context.id);

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
        } else if (typeof target !== 'function' && typeof target !== 'object') {
            console.error("dispatched new app state: ", target);
            throw new Error("App state passed a non-object value -- when using hyperapp-component, app state must be object (includes when initialized)");
        } else {
            return baseDispatch(target, props);
        }
    }

    return newDispatch;
}

export function component(params) {
    // Decide name
    var name;
    if(params.mountToAppState){
        name = params.name;
    } else {
        var baseName = (params.name || 'Unnamed');
        name = baseName;
        for (var i = 2; true; i++) {
            if (definedUnmountedComponentNames[name] === undefined) {
                break;
            } else {
                name = baseName + "_" + i.toString();
            }
        }

        // save used name
        definedUnmountedComponentNames[name] = true;
    }

    // Parameter check
    if (params.init !== undefined && typeof params.init !== "function") {
        console.error("Given `init` parameter of %s: %o", name, params.init);
        throw new Error("`init` parameter of component must be undefined or a function to generate new initial value");
    }

    // Generate component function
    var singletonCheck = function (id) {
        if (params.singleton && id !== undefined) {
            throw new Error(name + " is a singleton component -- id cannot be passed");
        }
    }

    var newComponent = function (props, children) {
        singletonCheck();
        if(props.id === undefined) props.id = '';

        var partialState = getPartialState(name, params, props.state, props.id);

        var c = newComponent.context(props.id);
        var result = params.view(c, partialState, props, children);

        return result;
    };

    // set slice function
    newComponent.slice = function(appState, id){
        singletonCheck(id);
        return getPartialState(name, params, appState, id);
    }

    // set context function
    newComponent.context = function(){
        if (arguments.length >= 2){
            var id = arguments[0];
            singletonCheck(id);
            var action = arguments[1];

            return { "__componentContext__": true, action: action, id: id, componentName: name, componentParams: params };
        } else {
            // partial application
            var id = arguments[0];
            singletonCheck(id);

            return function(baseAction) {
                return newComponent.context(id, baseAction);
            };
        }
    }

    // set destroy function
    newComponent.destroy = function(state, target){
        singletonCheck(target);
        return DestroyComponentStateAction(state, { componentName: name, target: target, componentParams: params });
    }

    newComponent.destroyAll = function(state) {
        return DestroyComponentStateAction(state, { componentName: name, componentParams: params, all: true });
    }

    // set destroy effect function
    newComponent.destroyEffect = function (target) {
        singletonCheck(target);
        return [DestroyComponentStateRunner, { componentName: name, target: target, componentParams: params }];
    }

    newComponent.destroyAllEffect = function() {
        return [DestroyComponentStateRunner, { componentName: name, componentParams: params, all: true }];
    }

    return newComponent;
}