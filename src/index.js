"use strict";

var componentParams = {};
var usedPaths = {};

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

export function componentHandler(baseDispatch) {
    var currentState = undefined;
    var dispatchStackLevel = 0;

    var newDispatch = function (target, props) {
        var ret = undefined;
        var notRaised = false;
        var rendered = false;
        dispatchStackLevel++;
        console.group("(stack %d - %o)", dispatchStackLevel, target); // ★

        try {
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
                            ret = newDispatch([context].concat(actionResult), props);
                        } else {
                            ret = newDispatch([context, actionResult], props);
                        }
                    } else {
                        // new state (with efffects)
                        var newPartialState = undefined;
                        var effects = undefined;
                        if(target.length >= 2){
                            newPartialState = target[1];
                            effects = target.slice(2);
                        } else {
                            newPartialState = target[1];
                        }

                        var newState = objectAssign({}, currentState);
                        if (newState["__components__"] === undefined) {
                            newState["__components__"] = {};
                        }
                        newState["__components__"][context.path] = newPartialState;
                        currentState = newState;

                        if(effects){
                            ret = baseDispatch([newState].concat(effects), props);
                        } else {
                            ret = baseDispatch(newState, props);
                        }
                    }
                } else {
                    currentState = target[0];
                    ret = baseDispatch(target, props);
                    if (target !== ret) rendered = true;
                }
            } else if (typeof target === 'object') {
                currentState = target;
                ret = baseDispatch(target, props);
                if(target !== ret) rendered = true;
            } else {
                ret = baseDispatch(target, props);
            }

            notRaised = true;
        } finally {
            dispatchStackLevel--;
        }
        console.groupEnd(); // ★

        // Destroy component states (as GC)
        if (dispatchStackLevel === 0 && currentState["__components__"] !== undefined) { // finished all dispatch and component state is stored
            if (notRaised && rendered) {
                console.log('usedPaths:', usedPaths);
                for (var path in currentState["__components__"]) {
                    if (!usedPaths[path]) {
                        delete currentState["__components__"][path];
                        console.log('GC:', path);
                    }
                }
            }

            usedPaths = {};
            rendered = false;
        }

        return ret;
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
        if(typeof key === 'number') key = key.toString();
        if(key === undefined) key = "";
        encodedPathList.push(encode(name), encode(key));

        var path = makePathString(encodedPathList);
        var partialState = getPartialState(params.init, props.state, path);

        var context = { "__componentContext__": true, name: name, key: key, path: path };
        usedPaths[path] = true;
        var result = params.view(context, partialState, props, children);

        encodedPathList.pop();
        encodedPathList.pop();

        return result;
    };

    // Store params
    componentParams[name] = params;

    return newComponent;
}