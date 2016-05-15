import {AppState} from '../../interfaces/preboot_ref';
import {ListenStrategy} from '../../interfaces/strategy';
import {NodeEvent} from '../../interfaces/event';

/**
 * This listen strategy uses a list of selectors maped to events. For example:
 *    {
 *      'input[type="text"],textarea': ['focusin', 'focusout'],
 *      'button': ['click']
 *    }
 */
export function getNodeEvents(app, appstate:AppState, strategy: ListenStrategy): NodeEvent[] {
  let nodeEvents = [];
  let eventsBySelector = strategy.eventsBySelector || {};
  let selectors = Object.keys(eventsBySelector);

  // loop through selectors
  for (let selector of selectors) {
    let events = eventsBySelector[selector];
    let elems = app.getAllAppNodes(appstate, selector);

    // if no elems, go to next iteration in for loop
    if (!elems) { continue; }

    // for each node and eventName combo, add a nodeEvent
    for (let elem of elems) {
      for (let eventName of events) {
        nodeEvents.push({
          node: elem,
          eventName: eventName
        });
      }
    }
  }

  return nodeEvents;
}
