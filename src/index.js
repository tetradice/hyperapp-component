"use strict";

var componentParams = {};

export function componentHandler(baseDispatch) {
    var currentState = undefined;

    var newDispatch = function (target, props) {
        console.log("newDispatch target:", target);

        if (Array.isArray(target)) {
            if (typeof target[0] === 'object' && target[0]['__componentContext__']) {
                var context = target[0];

                var adjustedState = Object.assign({}, currentState);
                if (adjustedState === undefined) {
                    adjustedState = {};
                }
                if (adjustedState["__components__"] === undefined) {
                    adjustedState["__components__"] = {};
                }
                if (adjustedState["__components__"][context.name] === undefined) {
                    adjustedState["__components__"][context.name] = {};
                }
                if (adjustedState["__components__"][context.name][context.id] === undefined) {
                    var params = componentParams[context.name];
                    adjustedState["__components__"][context.name][context.id] = (params.init ? params.init() : undefined);
                }

                if(typeof target[1] === 'function'){
                    // action
                    var action = target[1];
                    var payload = target[2];
                    var pState = adjustedState["__components__"][context.name][context.id];

                    var actionResult;
                    if(typeof payload === 'function'){
                        // payload creator
                        actionResult = action(pState, payload(props));
                    } else if (payload !== undefined) {
                        // custom payload
                        actionResult = action(pState, payload);
                    } else {
                        // default payload
                        actionResult = action(pState, props);
                    }

                    if(Array.isArray(actionResult)){
                        return newDispatch([context].concat(actionResult), props);
                    } else {
                        return newDispatch([context, actionResult], props);
                    }
                } else {
                    // new state
                    var newPState = target[1];

                    adjustedState["__components__"][context.name][context.id] = newPState;
                    currentState = adjustedState;
                    return baseDispatch(adjustedState, props); // TODO: Effect
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

export function component(params) {
    // Decide name
    var baseName = (params.name || 'Unnamed');
    var name = baseName;
    for(var i = 2; true; i++){
        if(componentParams[name] === undefined){
            break;
        } else {
            name = baseName + "_" + i.toString();
        }
    }

    // Generate component function
    var newComponent = function (props, children) {
        var id = (props.id === undefined ? '' : props.id);

        var partialState = undefined;
        if (props.state["__components__"] && props.state["__components__"][name]) {
            partialState = props.state["__components__"][name][id];
        }
        if (partialState === undefined && params.init){
            partialState = params.init();
        }

        var context = { "__componentContext__": true, name: name, id: id };
        return params.view(context, partialState, props, children);
    };

    // Store params
    componentParams[name] = params;

    return newComponent;
}