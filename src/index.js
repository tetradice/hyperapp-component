"use strict";

var moduleParams = {};

export function modularize(baseDispatch) {
    var currentState = undefined;

    var newDispatch = function (target, props) {
        console.log("newDispatch target:", target);

        if (Array.isArray(target)) {
            if (typeof target[0] === 'object' && target[0]['__modularizeContext__']) {
                var context = target[0];

                var adjustedState = Object.assign({}, currentState);
                if (adjustedState === undefined) {
                    adjustedState = {};
                }
                if (adjustedState["__modularize__"] === undefined) {
                    adjustedState["__modularize__"] = {};
                }
                if (adjustedState["__modularize__"][context.name] === undefined) {
                    adjustedState["__modularize__"][context.name] = {};
                }
                if (adjustedState["__modularize__"][context.name][context.id] === undefined) {
                    var params = moduleParams[context.name];
                    adjustedState["__modularize__"][context.name][context.id] = (params.init ? params.init() : undefined);
                }

                if(typeof target[1] === 'function'){
                    // action
                    var action = target[1];
                    var payload = target[2];
                    var pState = adjustedState["__modularize__"][context.name][context.id];

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

                    adjustedState["__modularize__"][context.name][context.id] = newPState;
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

export function createModule(name, params) {
    var mod = function (props, children) {
        var mState = undefined;
        if (props.state["__modularize__"] && props.state["__modularize__"][name]) {
            mState = props.state["__modularize__"][name][props.id];
        }
        if (mState === undefined && params.init){
            mState = params.init();
        }

        var context = { "__modularizeContext__": true, name: name, id: props.id };
        return params.view(context, props, mState);
    };
    moduleParams[name] = params;

    return mod;
}