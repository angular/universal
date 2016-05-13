/**
 * This module coordinates all preboot events on the client side
 */
import {PrebootEvent} from '../interfaces/event';
import {AppState} from '../interfaces/preboot_ref';
import {PrebootOptions} from '../interfaces/preboot_options';
import {ListenStrategy} from '../interfaces/strategy';
import {Element} from '../interfaces/element';
import {DomEvent, NodeEvent} from '../interfaces/event';


// import all the listen and replay strategies here
// note: these will get filtered out by browserify at build time
import * as listenAttr from './listen/listen_by_attributes';
import * as listenEvt from './listen/listen_by_event_bindings';
import * as listenSelect from './listen/listen_by_selectors';
import * as replayHydrate from './replay/replay_after_hydrate';
import * as replayRerender from './replay/replay_after_rerender';
import * as dom from './dom'

const caretPositionEvents = ['keyup', 'keydown', 'focusin', 'mouseup', 'mousedown'];
const caretPositionNodes = ['INPUT', 'TEXTAREA'];

// export state for testing purposes
export let state = {
  eventListeners: [],
  events: [],
  listening: false
};

export let strategies = {
  listen: {
    'attributes': listenAttr,
    'event_bindings': listenEvt,
    'selectors': listenSelect
  },
  replay: {
    'hydrate': replayHydrate,
    'rerender': replayRerender
  }
};

/**
 * For a given node, add an event listener based on the given attribute. The attribute
 * must match the Angular pattern for event handlers (i.e. either (event)='blah()' or
 * on-event='blah'
 */
export function getEventHandler(appstate: AppState, strategy: ListenStrategy, node: Element, eventName: string): Function {
  return function (event: DomEvent) {

    // if we aren't listening anymore (i.e. bootstrap complete) then don't capture any more events
    if (!state.listening) { return; }

    // we want to wait until client bootstraps so don't allow default action
    if (strategy.preventDefault) {
      event.preventDefault();
    }

    // if we want to raise an event that others can listen for
    if (strategy.dispatchEvent) {
       dom.dispatchGlobalEvent(appstate, strategy.dispatchEvent);
    }

    // if callback provided for a custom action when an event occurs
    if (strategy.action) {
      strategy.action(appstate, node, event);
    }

    // this is for tracking focus; if no caret, then no active node; else set the node and node key
    if (caretPositionEvents.indexOf(eventName) < 0) {
      appstate.activeNode = null;
    } else {
      appstate.activeNode = {
        node: event.target,
        nodeKey: dom.getNodeKey(event.target, appstate.serverRoot)
      };
    }

    // if event occurred that affects caret position in a node that we care about, record it
    if (caretPositionEvents.indexOf(eventName) >= 0 &&
      caretPositionNodes.indexOf(node.tagName) >= 0) {

      appstate.selection = dom.getSelection(node);
    }

    // todo: need another solution for this hack
    if (eventName === 'keyup' && event.which === 13 && node.attributes['(keyup.enter)']) {
      dom.dispatchGlobalEvent(appstate, 'PrebootFreeze');
    }

    // we will record events for later replay unless explicitly marked as doNotReplay
    if (!strategy.doNotReplay) {
      let eventObj: PrebootEvent = {
        node: node,
        event: event,
        name: eventName,
        time: (new Date()).getTime()
      };
      
      eventObj.nodeKey = dom.getNodeKey(node, appstate.serverRoot);
      state.events.push(eventObj);
    }
  };
}

/**
 * Loop through node events and add listeners
 */
export function addEventListeners(appstate:AppState, nodeEvents: NodeEvent[], strategy: ListenStrategy) {
  for (let nodeEvent of nodeEvents) {
    let node = nodeEvent.node;
    let eventName = nodeEvent.eventName;
    let handler = getEventHandler(appstate, strategy, node, eventName);

    // add the actual event listener and keep a ref so we can remove the listener during cleanup
    node.addEventListener(eventName, handler);
    state.eventListeners.push({
      node: node,
      name: eventName,
      handler: handler
    });
  }
}

/**
 * Add event listeners based on node events found by the listen strategies.
 * Note that the getNodeEvents fn is gathered here without many safety
 * checks because we are doing all of those in src/server/normalize.ts.
 */
export function startListening(appstate: AppState) {
  state.listening = true;

  for (let strategy of appstate.opts.listen) {
    let getNodeEvents = strategy.getNodeEvents || strategies.listen[strategy.name].getNodeEvents;
    let nodeEvents = getNodeEvents(appstate, strategy); // TODO:refactor strategies...
    addEventListeners(appstate, nodeEvents, strategy);
  }
}

/**
 * Loop through replay strategies and call replayEvents functions. In most cases
 * there will be only one replay strategy, but users may want to add multiple in
 * some cases with the remaining events from one feeding into the next.
 * Note that as with startListening() above, there are very little safety checks
 * here in getting the replayEvents fn because those checks are in normalize.ts.
 */
export function replayEvents(appstate:AppState) {
  state.listening = false;

  for (let strategy of appstate.opts.replay) {
    let replayEvts = strategy.replayEvents || strategies.replay[strategy.name].replayEvents;
    state.events = replayEvts(appstate, strategy, state.events); // TODO:refactor strategies...
  }

  // it is probably an error if there are remaining events, but just log for now
 // preboot.log(5, state.events);
}

/**
 * Go through all the event listeners and clean them up
 * by removing them from the given node (i.e. element)
 */
export function cleanup(appstate:AppState) {
  let activeNode = appstate.activeNode;

  // if there is an active node set, it means focus was tracked in one or more of the listen strategies
  if (activeNode) {

    // add small delay here so we are sure buffer switch is done
    setTimeout(function () {

      // find the client node in the new client view
      let activeClientNode =  dom.findClientNode(appstate, activeNode.node, activeNode.nodeKey);
      if (activeClientNode) {
        dom.setSelection(activeClientNode, appstate.selection);
      } else {
      //  preboot.log(6, activeNode);
      }
    }, 1);
  }

  // cleanup the event listeners
  for (let listener of state.eventListeners) {
    listener.node.removeEventListener(listener.name, listener.handler);
  }

  // finally clear out the events
  state.events = [];
}
